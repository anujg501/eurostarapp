#!/usr/bin/env node
/*
 * Nano Banana image generator — edits a reference photo with Gemini's image
 * model, keeping the background/lighting and swapping the stone.
 *
 * Setup:
 *   - Set GEMINI_API_KEY in your environment (Claude Code env vars).
 *   - Optional: GEMINI_IMAGE_MODEL to pin the exact model id (see note below).
 *
 * Usage:
 *   node tools/nano-banana.mjs <reference.jpg> "<prompt>" <output.png>
 *   node tools/nano-banana.mjs --batch jobs.json
 *
 * jobs.json = [{ "ref": "ref.jpg", "prompt": "...", "out": "out/x.png" }, ...]
 *
 * NOTE on the model id: you're on Gemini 3, so confirm the current image model
 * with AI Studio → "Get code" (top-right). It's usually "gemini-2.5-flash-image"
 * ("Nano Banana"); if a newer id shows, set GEMINI_IMAGE_MODEL to it.
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

if (!KEY) {
  console.error('✗ GEMINI_API_KEY is not set in this session. Set it as an environment variable and start a fresh session.');
  process.exit(1);
}

function mimeOf(p) {
  const e = p.toLowerCase();
  if (e.endsWith('.png')) return 'image/png';
  if (e.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function generate(refPath, prompt, outPath) {
  const parts = [{ text: prompt }];
  if (refPath && fs.existsSync(refPath)) {
    parts.push({ inline_data: { mime_type: mimeOf(refPath), data: fs.readFileSync(refPath).toString('base64') } });
  }
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const res = await fetch(ENDPOINT(MODEL), {
    method: 'POST',
    headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(j).slice(0, 500)}`);
  const rparts = j?.candidates?.[0]?.content?.parts || [];
  const img = rparts.find((p) => p.inlineData || p.inline_data);
  if (!img) throw new Error(`No image in response: ${JSON.stringify(j).slice(0, 500)}`);
  const data = (img.inlineData || img.inline_data).data;
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
  console.log(`✓ ${outPath}`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--batch') {
    const jobs = JSON.parse(fs.readFileSync(argv[1], 'utf8'));
    let ok = 0;
    for (const [i, job] of jobs.entries()) {
      try {
        await generate(job.ref, job.prompt, job.out);
        ok++;
      } catch (e) {
        console.error(`✗ job ${i + 1} (${job.out}): ${e.message}`);
      }
    }
    console.log(`\nDone: ${ok}/${jobs.length} images written.`);
    return;
  }
  const [ref, prompt, out] = argv;
  if (!prompt || !out) {
    console.error('Usage: node tools/nano-banana.mjs <reference.jpg> "<prompt>" <output.png>');
    console.error('   or: node tools/nano-banana.mjs --batch jobs.json');
    process.exit(1);
  }
  await generate(ref, prompt, out);
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
