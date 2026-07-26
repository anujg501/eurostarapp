#!/usr/bin/env python3
"""Nano Banana (Gemini 2.5 Flash Image) gemstone image-edit pilot.

Takes a reference product image and re-renders it keeping the same
background / framing / lighting, replacing only the stone.
"""
import os, sys, json, base64, urllib.request

API_KEY = os.environ["GEMINI_API_KEY"]
MODEL = "gemini-2.5-flash-image"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

REF_PATH = sys.argv[1]
OUT_PATH = sys.argv[2]
PROMPT = sys.argv[3]

with open(REF_PATH, "rb") as f:
    ref_b64 = base64.b64encode(f.read()).decode()

mime = "image/png" if REF_PATH.lower().endswith(".png") else "image/jpeg"

payload = {
    "contents": [{
        "parts": [
            {"text": PROMPT},
            {"inline_data": {"mime_type": mime, "data": ref_b64}},
        ]
    }],
}

req = urllib.request.Request(
    URL, data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.load(resp)
except urllib.error.HTTPError as e:
    print("HTTP ERROR", e.code, e.read().decode()[:2000])
    sys.exit(1)

# Extract image part
img_written = False
for cand in data.get("candidates", []):
    for part in cand.get("content", {}).get("parts", []):
        inline = part.get("inline_data") or part.get("inlineData")
        if inline and inline.get("data"):
            with open(OUT_PATH, "wb") as out:
                out.write(base64.b64decode(inline["data"]))
            print("SAVED", OUT_PATH)
            img_written = True
        elif part.get("text"):
            print("MODEL TEXT:", part["text"][:500])

if not img_written:
    print("NO IMAGE RETURNED. Raw response (truncated):")
    print(json.dumps(data, indent=2)[:2000])
    sys.exit(2)
