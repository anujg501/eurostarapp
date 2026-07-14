import { prisma } from '../db';

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
} as const;
