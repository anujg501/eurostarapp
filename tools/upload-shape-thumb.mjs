#!/usr/bin/env node
// upload-shape-thumb.mjs — fill a catalogue shape thumbnail on the Eurostar API.
//
// Reads a data-URI image and merges it into the `shapeThumbs` setting
// (GET+PUT /admin/thumbs/shapes), keyed by shape id (e.g. "radiant").
// Existing thumbnails are preserved — this only adds/overwrites one key.
//
// Usage:
//   node tools/upload-shape-thumb.mjs --api https://eurostar-api.onrender.com --shape radiant
//   node tools/upload-shape-thumb.mjs --api http://localhost:8080 --shape radiant --dry-run
//
// Options:
//   --api <baseUrl>     API base (no trailing slash). Required.
//   --shape <id>        Shape id key. Default: radiant
//   --datauri <file>    File containing the data: URI. Default: images/radiant-thumb.datauri.txt
//   --dry-run           Fetch current map and show the merge, but do NOT write.

import { readFile } from 'node:fs/promises';

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const api = arg('api');
const shape = arg('shape', 'radiant');
const datauriFile = arg('datauri', 'images/radiant-thumb.datauri.txt');
const dryRun = arg('dry-run', false) === true;

if (!api || typeof api !== 'string') {
  console.error('Error: --api <baseUrl> is required (e.g. https://eurostar-api.onrender.com)');
  process.exit(1);
}
const base = api.replace(/\/+$/, '');
const endpoint = `${base}/admin/thumbs/shapes`;

const dataUri = (await readFile(datauriFile, 'utf8')).trim();
if (!dataUri.startsWith('data:image/')) {
  console.error(`Error: ${datauriFile} does not look like a data:image/... URI`);
  process.exit(1);
}
console.log(`Image: ${datauriFile} (${(dataUri.length / 1024).toFixed(1)} KB data URI)`);
console.log(`Shape key: "${shape}"`);
console.log(`Endpoint: ${endpoint}`);

// 1) Read the current map so we merge instead of clobbering other thumbnails.
let current = {};
try {
  const r = await fetch(endpoint, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) {
    console.error(`GET failed: ${r.status} ${(await r.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const body = await r.json();
  current = body && typeof body === 'object' ? body : {};
} catch (e) {
  console.error('GET request failed:', e.message, e.cause?.message || '');
  process.exit(1);
}

const existingKeys = Object.keys(current);
console.log(`Existing shape thumbnails: [${existingKeys.join(', ') || '(none)'}]`);
const replacing = shape in current;

const merged = { ...current, [shape]: dataUri };

if (dryRun) {
  console.log(`\n[dry-run] Would ${replacing ? 'REPLACE' : 'ADD'} "${shape}" and PUT ${Object.keys(merged).length} keys. No write performed.`);
  process.exit(0);
}

// 2) Write the merged map back.
try {
  const r = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(merged),
    signal: AbortSignal.timeout(30000),
  });
  const t = await r.text();
  if (!r.ok) {
    console.error(`PUT failed: ${r.status} ${t.slice(0, 300)}`);
    process.exit(1);
  }
  console.log(`\n✅ ${replacing ? 'Replaced' : 'Added'} "${shape}". Map now has ${Object.keys(merged).length} shape thumbnail(s).`);
  console.log('Refresh the catalogue to see the filled card.');
} catch (e) {
  console.error('PUT request failed:', e.message, e.cause?.message || '');
  process.exit(1);
}
