#!/usr/bin/env node
/*
 * admin-upload.cjs — log into the Eurostar admin API and upload product images,
 * or set any product-image slot, without touching the Admin UI.
 *
 * Credentials come from the environment (never hard-coded, never committed):
 *   EUROSTAR_ADMIN_USER   admin-panel login id
 *   EUROSTAR_ADMIN_PASS   its password
 *   EUROSTAR_ADMIN_ROLE   optional: admin | office  (default: try both)
 *   EUROSTAR_BASE         optional: default https://www.eurostargems.com
 *
 * Usage:
 *   node scripts/admin-upload.cjs --login-test
 *       just verify the credentials work.
 *
 *   node scripts/admin-upload.cjs \
 *       --file /path/A.jpg --key "whitefancy|white|alphabet-A" \
 *       --file /path/B.jpg --key "whitefancy|white|alphabet-B"
 *       upload each file and point that product-image key at it.
 *
 *   node scripts/admin-upload.cjs --map images.json
 *       images.json = { "cat|colour|shape": "/path/to/file.jpg", ... }
 *
 * Image keys are the same ones the storefront reads:
 *   <category>|<colour>|<shape>                       (most categories)
 *   <category>|<grade>|<colour>|<shape>               (grade-scoped ones)
 *   <category>|<colour>|alphabet-<LETTER>             (alphabet letters)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BASE = (process.env.EUROSTAR_BASE || 'https://www.eurostargems.com').replace(/\/+$/, '');
const USER = process.env.EUROSTAR_ADMIN_USER || '';
const PASS = process.env.EUROSTAR_ADMIN_PASS || '';
const ROLES = process.env.EUROSTAR_ADMIN_ROLE ? [process.env.EUROSTAR_ADMIN_ROLE] : ['admin', 'office'];

function die(msg) { console.error('✗ ' + msg); process.exit(1); }

function guessType(name) {
  const e = String(name).toLowerCase().split('.').pop();
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[e] || 'application/octet-stream';
}

// Log in, trying each candidate role until one succeeds. Returns an access token.
async function login() {
  if (!USER || !PASS) die('Set EUROSTAR_ADMIN_USER and EUROSTAR_ADMIN_PASS in the environment first.');
  let lastErr = '';
  for (const role of ROLES) {
    let r, d;
    try {
      r = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ role, username: USER, password: PASS, remember: true }),
      });
      d = await r.json().catch(() => ({}));
    } catch (e) { die('Could not reach ' + BASE + ' — is the host allowed in this environment? (' + e.message + ')'); }
    if (r.ok && d && d.accessToken) return { token: d.accessToken, role, user: d.user };
    lastErr = (d && d.error) || ('HTTP ' + r.status);
  }
  die('Login failed (' + lastErr + '). Check the username/password and that the account role is admin or office.');
}

async function uploadFile(token, file) {
  if (!fs.existsSync(file)) throw new Error('No such file: ' + file);
  const buf = fs.readFileSync(file);
  const name = path.basename(file);
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: guessType(name) }), name);
  const r = await fetch(`${BASE}/admin/upload?folder=product-images`, {
    method: 'POST', headers: { authorization: 'Bearer ' + token }, body: fd,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d || !d.url) throw new Error('upload failed (' + ((d && d.error) || ('HTTP ' + r.status)) + ')');
  return d.url;
}

async function getImages(token) {
  const r = await fetch(`${BASE}/admin/product-images`, { headers: { authorization: 'Bearer ' + token, accept: 'application/json' } });
  if (!r.ok) throw new Error('could not read product-images (HTTP ' + r.status + ')');
  return (await r.json().catch(() => ({}))) || {};
}

async function putImages(token, map) {
  const r = await fetch(`${BASE}/admin/product-images`, {
    method: 'PUT', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(map),
  });
  if (!r.ok) throw new Error('saving product-images failed (HTTP ' + r.status + ')');
}

function parseArgs(argv) {
  const out = { pairs: [], loginTest: false, map: null };
  let pendingFile = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--login-test') out.loginTest = true;
    else if (a === '--map') out.map = argv[++i];
    else if (a === '--file') pendingFile = argv[++i];
    else if (a === '--key') { if (!pendingFile) die('--key must follow a --file'); out.pairs.push({ file: pendingFile, key: argv[++i] }); pendingFile = null; }
    else die('Unknown argument: ' + a);
  }
  if (pendingFile) die('--file ' + pendingFile + ' has no matching --key');
  if (out.map) {
    const m = JSON.parse(fs.readFileSync(out.map, 'utf8'));
    for (const key of Object.keys(m)) out.pairs.push({ file: m[key], key });
  }
  return out;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const { token, role, user } = await login();
  console.log('✓ Logged in to ' + BASE + ' as ' + (user && (user.userId || user.name) || USER) + ' (role: ' + role + ')');
  if (args.loginTest) { console.log('✓ Login test OK.'); return; }
  if (!args.pairs.length) { console.log('Nothing to upload. Pass --file/--key pairs or --map file.json.'); return; }

  const current = await getImages(token);
  const map = { ...current };
  const done = [];
  for (const { file, key } of args.pairs) {
    process.stdout.write('… ' + key + '  ← ' + path.basename(file) + ' ');
    try {
      const url = await uploadFile(token, file);
      map[key] = url;
      done.push(key);
      console.log('✓');
    } catch (e) { console.log('✗ ' + e.message); }
  }
  if (!done.length) die('No images uploaded.');
  await putImages(token, map);
  console.log('✓ Saved ' + done.length + ' image(s) to the live admin. Allow ~1 minute, then hard-refresh the shop.');
})().catch((e) => die(e.message));
