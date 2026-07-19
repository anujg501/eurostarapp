import { prisma } from '../db';
import { config } from '../config';

// Generic JSON key/value store used for admin content overlays (catalog colours/
// shapes, thumbnails, splash, category order, Mira images/enabled, language…).

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  });
}

// The exact client localStorage keys, reused verbatim as setting keys so the
// apps map 1:1 when wired.
export const KEYS = {
  extraColours: 'eurostar-extra-colors-v1',
  extraShapes: 'eurostar-extra-shapes-v1',
  gradeOverrides: 'eurostar-grades-override-v1',
  productImages: 'eurostar-product-images-v1',
  catThumbs: 'eurostar-cat-thumbs-v1',
  shapeThumbs: 'eurostar-shape-thumbs-v1',
  catOrder: 'eurostar.catOrder.v1',
  splashImage: 'eurostar-splash-image',
  splashActive: 'eurostar-splash-active',
  miraImages: 'eurostar-mira-images',
  miraEnabled: 'eurostar-mira-enabled',
  lang: 'eurostar-lang',
  lmsMeetingLinks: 'eurostar-lms-meeting-links-v1',
  // Admin "Settings" screen — the trading rules the storefront applies. These
  // were previously hardcoded in config.rules and the Settings inputs saved
  // nowhere; the API now reads overrides from here.
  storeRules: 'eurostar-store-rules-v1',
  // Admin "Content" screen — hero copy, footer and testimonials.
  siteContent: 'eurostar-site-content-v1',
} as const;

// ---------------------------------------------------------------------------
// Store rules — the trading maths the Admin "Settings" screen edits.
//
// config.rules holds the built-in defaults; the Setting row holds the operator's
// overrides. Everything that prices an order must read THIS, not config.rules
// directly, or the Settings screen saves values nothing ever applies.
// ---------------------------------------------------------------------------
export type StoreRules = typeof config.rules;

// Cached because it is read on every order and cart. Short TTL so a change in
// Admin takes effect without a restart; cleared immediately on save.
let rulesCache: { at: number; value: StoreRules } | null = null;
const RULES_TTL_MS = 15_000;

export function invalidateStoreRules(): void {
  rulesCache = null;
}

export async function getStoreRules(): Promise<StoreRules> {
  if (rulesCache && Date.now() - rulesCache.at < RULES_TTL_MS) return rulesCache.value;

  const saved = await getSetting<Partial<StoreRules>>(KEYS.storeRules, {});
  // Only take keys the operator actually set — a blank field must not become 0.
  const merged = { ...config.rules };
  for (const [k, v] of Object.entries(saved ?? {})) {
    if (typeof v === 'number' && Number.isFinite(v)) (merged as Record<string, number>)[k] = v;
  }

  rulesCache = { at: Date.now(), value: merged };
  return merged;
}
