#!/usr/bin/env node
// nano-banana.mjs — generate images with Google's Gemini image model ("nano banana")
// via the Gemini API. Requires GEMINI_API_KEY in the environment.
//
// Usage:
//   node tools/nano-banana.mjs --prompt "..." --out images/test.png
//   node tools/nano-banana.mjs -p "..." -o images/out.png --model gemini-2.5-flash-image
//
// Notes:
//   - Writes the first inline image returned by the model to --out.
//   - Trusts the agent proxy CA bundle if NODE_EXTRA_CA_CERTS is not already set.

import { writeFile, mkdir, access } from 'node:fs/promises';
import { dirname } from 'node:path';

// Ensure the proxy CA bundle is trusted (no-op if already configured globally).
const CA_BUNDLE = '/root/.ccr/ca-bundle.crt';
if (!process.env.NODE_EXTRA_CA_CERTS) {
  try {
    await access(CA_BUNDLE);
    process.env.NODE_EXTRA_CA_CERTS = CA_BUNDLE;
  } catch { /* bundle not present; rely on system trust */ }
}

function parseArgs(argv) {
  const args = { model: 'gemini-2.5-flash-image', inputs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prompt' || a === '-p') args.prompt = argv[++i];
    else if (a === '--out' || a === '-o') args.out = argv[++i];
    else if (a === '--model' || a === '-m') args.model = argv[++i];
    else if (a === '--input' || a === '-i') args.inputs.push(argv[++i]); // edit an existing image (repeatable)
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

import { readFile } from 'node:fs/promises';
function mimeFor(path) {
  const p = path.toLowerCase();
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

function usage() {
  console.log(`Usage: node tools/nano-banana.mjs --prompt "<text>" --out <path.png> [--model <id>]`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help) { usage(); process.exit(0); }

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not set.');
  process.exit(1);
}
if (!args.prompt) {
  console.error('Error: --prompt is required.');
  usage();
  process.exit(1);
}
if (!args.out) {
  console.error('Error: --out is required.');
  usage();
  process.exit(1);
}

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`;

// Build request parts: any input images first (for editing), then the text instruction.
const reqParts = [];
for (const imgPath of args.inputs) {
  const buf = await readFile(imgPath);
  reqParts.push({ inlineData: { mimeType: mimeFor(imgPath), data: buf.toString('base64') } });
}
reqParts.push({ text: args.prompt });

const body = { contents: [{ parts: reqParts }] };

console.log(`${args.inputs.length ? 'Editing' : 'Generating'} with model "${args.model}"${args.inputs.length ? ` (${args.inputs.length} input image[s])` : ''}...`);

let res;
try {
  res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });
} catch (e) {
  console.error('Request failed:', e.message, e.cause?.message || '');
  process.exit(1);
}

const text = await res.text();
if (!res.ok) {
  console.error(`API error ${res.status}:`);
  console.error(text.slice(0, 2000));
  process.exit(1);
}

let data;
try {
  data = JSON.parse(text);
} catch {
  console.error('Could not parse API response as JSON:');
  console.error(text.slice(0, 2000));
  process.exit(1);
}

const parts = data?.candidates?.[0]?.content?.parts ?? [];
const imagePart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
const inline = imagePart?.inlineData || imagePart?.inline_data;

if (!inline?.data) {
  const textPart = parts.find((p) => typeof p.text === 'string');
  console.error('No image returned by the model.');
  if (textPart) console.error('Model text response:', textPart.text.slice(0, 1000));
  else console.error(JSON.stringify(data, null, 2).slice(0, 2000));
  process.exit(1);
}

const buf = Buffer.from(inline.data, 'base64');
await mkdir(dirname(args.out), { recursive: true });
await writeFile(args.out, buf);

console.log(`Wrote ${buf.length} bytes to ${args.out} (mime: ${inline.mimeType || inline.mime_type || 'unknown'})`);
