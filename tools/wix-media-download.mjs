#!/usr/bin/env node
// wix-media-download.mjs — download every file from the Wix Media Manager,
// preserving folder structure and original names.
//
// Setup (one time):
//   1. Create a Wix API key:  https://manage.wix.com/account/api-keys
//      → Generate API key → give it the "Media Manager" permission (read).
//   2. Run:
//        export WIX_API_KEY="the-key-you-copied"
//        node tools/wix-media-download.mjs
//
// Site ID is pre-filled for this account; override with WIX_SITE_ID if needed.
// Output goes to ./wix-media/<folder path>/<file name>. Re-running skips files
// already downloaded, so it's safe to resume if it stops.

import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const API = 'https://www.wixapis.com/site-media/v1';
const KEY = process.env.WIX_API_KEY;
const SITE = process.env.WIX_SITE_ID || '16480822-c302-4134-b6c3-e4553bfe4bfd';
const OUT = process.env.OUT_DIR || 'wix-media';
const ROOT = 'media-root';

if (!KEY) {
  console.error('Error: WIX_API_KEY is not set.\n' +
    'Create one at https://manage.wix.com/account/api-keys (permission: Media Manager),\n' +
    'then: export WIX_API_KEY="..."  and re-run.');
  process.exit(1);
}

const headers = { Authorization: KEY, 'wix-site-id': SITE, 'Content-Type': 'application/json' };

async function api(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}${path}${qs ? '?' + qs : ''}`;
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(60000) });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`GET ${path} -> ${r.status}\n${text.slice(0, 600)}`);
  }
  return JSON.parse(text);
}

// List all items (files or folders) under a parent, following pagination.
async function listAll(kind, parentFolderId) {
  const out = [];
  let cursor = null;
  do {
    const params = { parentFolderId, 'paging.limit': '100' };
    if (cursor) params['paging.cursor'] = cursor;
    const data = await api(`/${kind}`, params);
    out.push(...(data[kind] || []));
    cursor = data?.pagingMetadata?.cursors?.next || null;
  } while (cursor);
  return out;
}

const exists = (p) => access(p).then(() => true, () => false);

let downloaded = 0, skipped = 0, failed = 0;

async function download(file, folderPath) {
  const name = file.displayName || file.originalFileName || `${file.id}`;
  const dest = join(OUT, folderPath, name.replace(/[\/\\]/g, '_'));
  if (await exists(dest)) { skipped++; return; }
  const src = file.url || file?.media?.image?.image?.url || file?.media?.image?.url;
  if (!src) { console.warn(`  ! no URL for ${folderPath}/${name}`); failed++; return; }
  try {
    const r = await fetch(src, { signal: AbortSignal.timeout(120000) });
    if (!r.ok) { console.warn(`  ! ${r.status} for ${name}`); failed++; return; }
    const buf = Buffer.from(await r.arrayBuffer());
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    downloaded++;
    if (downloaded % 25 === 0) console.log(`  … ${downloaded} downloaded`);
  } catch (e) {
    console.warn(`  ! failed ${name}: ${e.message}`); failed++;
  }
}

async function walk(folderId, folderPath) {
  const files = await listAll('files', folderId);
  if (files.length) console.log(`${folderPath || '/'}  (${files.length} files)`);
  await mkdir(join(OUT, folderPath), { recursive: true });
  for (const f of files) await download(f, folderPath);
  const folders = await listAll('folders', folderId);
  for (const sub of folders) {
    const name = (sub.displayName || sub.id).replace(/[\/\\]/g, '_');
    await walk(sub.id, join(folderPath, name));
  }
}

console.log(`Downloading Wix media for site ${SITE} into ./${OUT}/ …\n`);
try {
  await walk(ROOT, '');
  console.log(`\nDone. Downloaded ${downloaded}, skipped ${skipped} (already had), failed ${failed}.`);
  console.log(`Files are in ./${OUT}/  (mirrors your Wix folder structure).`);
} catch (e) {
  console.error('\nStopped with an error:\n' + e.message);
  console.error('\nCopy this error and send it back — the API field names or permissions may need a tweak.');
  process.exit(1);
}
