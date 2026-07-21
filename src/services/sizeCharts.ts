import fs from 'fs';
import path from 'path';
import vm from 'vm';

// The calibrated size charts, the per-size price multipliers and the packet
// piece counts all live in docs/app/data.jsx — a browser file the server cannot
// import. The Admin's pricing matrix needs the same numbers the storefront uses,
// and duplicating them here would guarantee the two drift apart.
//
// Same approach as catalogOverlays.ts: run the file in a sandbox and read the
// tables back out. Cached, because the file is large and never changes at
// runtime.

type Charts = {
  sizesByCategory: Record<string, string[]>;
  fullSizes: Record<string, string[]>;
  sizeMulti: Record<string, number>;
  packetPcsByCategory: Record<string, Record<string, number>>;
  packetPcsDefault: Record<string, number>;
  unitByCategory: Record<string, string>;
};

let cache: Charts | null = null;

function readCharts(): Charts | null {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), 'docs', 'app', 'data.jsx');
    const code = fs.readFileSync(file, 'utf8');
    const sandbox: Record<string, unknown> = {
      window: {},
      localStorage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
      console: { log: () => undefined, warn: () => undefined, error: () => undefined },
    };
    sandbox.globalThis = sandbox;
    const out = vm.runInNewContext(
      code +
        '\n;({ sizesByCategory: SIZES_BY_CATEGORY, fullSizes: FULL_SIZES, sizeMulti: SIZE_PRICE_MULTI,' +
        ' packetPcsByCategory: PACKET_PCS_BY_CATEGORY, packetPcsDefault: PACKET_PCS_DEFAULT,' +
        ' unitByCategory: UNIT_BY_CATEGORY });',
      sandbox,
      { timeout: 10_000 }
    ) as Partial<Charts>;
    if (!out || typeof out.sizeMulti !== 'object') return null;
    cache = {
      sizesByCategory: out.sizesByCategory ?? {},
      fullSizes: out.fullSizes ?? {},
      sizeMulti: out.sizeMulti ?? {},
      packetPcsByCategory: out.packetPcsByCategory ?? {},
      packetPcsDefault: out.packetPcsDefault ?? {},
      unitByCategory: out.unitByCategory ?? {},
    };
    return cache;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Size charts: could not read docs/app/data.jsx:', (e as Error).message);
    return null;
  }
}

/** Sizes for a category + shape, in chart order. A category with its own chart
 *  wins; otherwise the shape's standard calibrated list is used. */
export function sizesFor(categoryKey: string, shape: string): string[] {
  const c = readCharts();
  if (!c) return [];
  const own = c.sizesByCategory[categoryKey];
  if (Array.isArray(own) && own.length) return own.slice();
  const byShape = c.fullSizes[shape] || c.fullSizes[String(shape).toLowerCase()];
  return Array.isArray(byShape) ? byShape.slice() : [];
}

/** The storefront's own suggestion for a size that has no SKU yet: the grade's
 *  base rate scaled by that size's multiplier — the "base × size multiplier"
 *  the reference panel shows in its notes column. */
export function suggestedRate(basePrice: number, size: string): number {
  const c = readCharts();
  const mult = (c && c.sizeMulti[size]) || 1;
  return Math.max(0, Math.round(basePrice * mult));
}

/** Pieces in one packet of this size, per the storefront's chart. */
export function chartPacketPcs(categoryKey: string, size: string): number {
  const c = readCharts();
  if (!c) return 144;
  const own = c.packetPcsByCategory[categoryKey];
  if (own && typeof own[size] === 'number') return own[size];
  if (typeof c.packetPcsDefault[size] === 'number') return c.packetPcsDefault[size];
  return 144;
}

/** Unit of sale for a category (pc | ct | pkt | …) as the storefront reads it. */
export function unitFor(categoryKey: string): string {
  const c = readCharts();
  return (c && c.unitByCategory[categoryKey]) || 'pc';
}
