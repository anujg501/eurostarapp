# Gemstone image pilot — Nano Banana (Gemini image edit)

Pilot to re-render high-end gemstone product photos by **image-editing** a
reference photo: keep the same background / framing / studio lighting and
replace only the stone.

## Status: BLOCKED on API billing tier (no image generated yet)

- `GEMINI_API_KEY` is set and valid — text calls (`gemini-flash-latest`) succeed.
- The image model `gemini-2.5-flash-image` ("Nano Banana") is listed on the account.
- Image generation returns **HTTP 429 `RESOURCE_EXHAUSTED`** with
  `free_tier_requests, limit: 0` — the project is on the **free tier, which
  allows zero image-generation requests**. Retrying after the suggested
  cooldown gives the identical error, so it is a hard tier block, not a
  transient rate limit.

**To unblock:** enable a paid/billing plan on the Google AI Studio / Cloud
project behind the key (https://aistudio.google.com), or supply a paid-tier key.

## Run

```bash
python3 generate.py <reference_image> <output_image> "<edit prompt>"
```

Example (item 1 — Milky Corals · Grade A · Coral · Round Cabs):

```bash
python3 generate.py \
  ../docs/admin/assets/products/gem-red.png \
  generated_01_milky-coral-round-cab.png \
  "keep the EXACT same background, framing, composition, camera angle and studio lighting. Replace only the central stone with a single Grade A milky coral round cabochon: smooth polished opaque dome, soft warm salmon-coral colour with milky translucence, no facets, centred, razor sharp, high-end catalog product photo, photorealistic."
```

## Notes

- Reference used for the pilot: repo asset `docs/admin/assets/products/gem-red.png`
  (round framing, warm tone). It is a **cream-background vector illustration**,
  not a black-velvet studio photo — a true black-velvet reference will match the
  intended look far better.
- Nothing is uploaded or published; generated files stay local pending review.
