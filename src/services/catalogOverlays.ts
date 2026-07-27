import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { getSetting, setSetting, KEYS } from './settings';

// The storefront's built-in colours and shapes live in docs/app/data.jsx — a
// browser file the server cannot import. On a fresh database the Admin's
// colour × shape matrix is therefore empty even though the storefront shows a
// full palette. This lifts the built-ins into the same overlay maps the Admin
// edits. The storefront merge deduplicates by id, so customers see no change;
// the lift is idempotent and never removes or rewrites an admin-added entry.

type Colour = { id: string; name: string; hex?: string; shapes?: string[] };

// The storefront picks a product's shapes/colours from MANY structures, not just
// SHAPES_BY_CATEGORY / COLORS_BY_CATEGORY (see screen-browse.jsx): a colour can
// carry its own `shapes`, a grade can override shapes (Pearls/Navratna/White
// Fancy/Polki), Lab Grown gates by cut list, and several categories swap the
// whole colour set per grade. If the admin only lifts the two flat base tables
// it misses every one of those (e.g. Lab Opals shows Heart+Marquise on the shop
// but not in the panel). So we read all of them and lift the UNION — every
// shape/colour a customer could ever see becomes an upload slot. The storefront
// itself is untouched (it keeps its per-colour/per-grade gating); we only widen
// what the admin exposes.
type Builtin = {
  colours: Record<string, Colour[]>;
  shapes: Record<string, string[]>;
  colourByGrade: Record<string, Record<string, Colour[]> | null>;
  shapeByGrade: Record<string, Record<string, string[]> | null>;
  shapeLists: Record<string, string[]>;
};

function readBuiltinCatalogue(): Builtin | null {
  try {
    const file = path.join(process.cwd(), 'docs', 'app', 'data.jsx');
    const code = fs.readFileSync(file, 'utf8');
    // data.jsx is plain JS (no JSX) written for the browser; give it the two
    // browser globals it touches and read the tables back out.
    const sandbox: Record<string, unknown> = {
      window: {},
      localStorage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
      console: { log: () => undefined, warn: () => undefined, error: () => undefined },
    };
    sandbox.globalThis = sandbox;
    // `typeof X` never throws for an undeclared name, so optional structures that
    // may not exist in a given data.jsx revision degrade to null safely.
    const epilogue = `
;(function () {
  var g = function (n) { return n; };
  return {
    colours: COLORS_BY_CATEGORY,
    shapes: SHAPES_BY_CATEGORY,
    colourByGrade: {
      pearls: typeof PEARL_COLORS_BY_GRADE !== 'undefined' ? PEARL_COLORS_BY_GRADE : null,
      corundum: typeof CORUNDUM_COLORS_BY_GRADE !== 'undefined' ? CORUNDUM_COLORS_BY_GRADE : null,
      cz: typeof CZ_COLORS_BY_GRADE !== 'undefined' ? CZ_COLORS_BY_GRADE : null,
      rajkot: typeof RAJKOT_COLORS_BY_GRADE !== 'undefined' ? RAJKOT_COLORS_BY_GRADE : null,
      opaque: typeof OPAQUE_COLORS_BY_GRADE !== 'undefined' ? OPAQUE_COLORS_BY_GRADE : null,
      labgrown: typeof LABGROWN_COLORS_BY_GRADE !== 'undefined' ? LABGROWN_COLORS_BY_GRADE : null,
    },
    shapeByGrade: {
      pearls: typeof PEARL_SHAPES_BY_GRADE !== 'undefined' ? PEARL_SHAPES_BY_GRADE : null,
      navratna: typeof NAVRATNA_SHAPES_BY_GRADE !== 'undefined' ? NAVRATNA_SHAPES_BY_GRADE : null,
      whitefancy: typeof WHITEFANCY_SHAPES_BY_GRADE !== 'undefined' ? WHITEFANCY_SHAPES_BY_GRADE : null,
      polki: typeof POLKI_SHAPES_BY_GRADE !== 'undefined' ? POLKI_SHAPES_BY_GRADE : null,
    },
    shapeLists: {
      labgrown: [].concat(
        typeof LABGROWN_SHAPES !== 'undefined' ? LABGROWN_SHAPES : [],
        typeof LABCORUNDUM_SHAPES !== 'undefined' ? LABCORUNDUM_SHAPES : []
      ),
    },
  };
})()`;
    const out = vm.runInNewContext(code + epilogue, sandbox, { timeout: 10_000 }) as Partial<Builtin>;
    if (!out || typeof out.colours !== 'object' || typeof out.shapes !== 'object') return null;
    return {
      colours: out.colours as Record<string, Colour[]>,
      shapes: out.shapes as Record<string, string[]>,
      colourByGrade: (out.colourByGrade as Builtin['colourByGrade']) || {},
      shapeByGrade: (out.shapeByGrade as Builtin['shapeByGrade']) || {},
      shapeLists: (out.shapeLists as Record<string, string[]>) || {},
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Catalog overlays: could not read docs/app/data.jsx:', (e as Error).message);
    return null;
  }
}

// Expand the base tables into the full per-category union the storefront can show.
function unionCatalogue(b: Builtin): { colours: Record<string, Colour[]>; shapes: Record<string, string[]> } {
  const cats = new Set<string>([
    ...Object.keys(b.colours || {}),
    ...Object.keys(b.shapes || {}),
  ]);

  const shapes: Record<string, string[]> = {};
  const colours: Record<string, Colour[]> = {};

  for (const cat of cats) {
    // ---- shapes union ----
    const sSet = new Set<string>();
    (b.shapes[cat] || []).forEach((s) => sSet.add(s));
    (b.colours[cat] || []).forEach((c) => (c.shapes || []).forEach((s) => sSet.add(s)));
    const sg = b.shapeByGrade[cat];
    if (sg) Object.values(sg).forEach((arr) => (arr || []).forEach((s) => sSet.add(s)));
    const cg = b.colourByGrade[cat];
    if (cg) Object.values(cg).forEach((list) => (list || []).forEach((c) => (c.shapes || []).forEach((s) => sSet.add(s))));
    (b.shapeLists[cat] || []).forEach((s) => sSet.add(s));
    if (sSet.size) shapes[cat] = [...sSet];

    // ---- colours union ----
    const seen = new Set<string>();
    const cList: Colour[] = [];
    const push = (c: Colour) => { if (c && c.id && !seen.has(c.id)) { seen.add(c.id); cList.push({ id: c.id, name: c.name, hex: c.hex }); } };
    (b.colours[cat] || []).forEach(push);
    if (cg) Object.values(cg).forEach((list) => (list || []).forEach(push));
    if (cList.length) colours[cat] = cList;
  }

  return { colours, shapes };
}

/** Merge the storefront's built-in colours/shapes into the admin overlay maps.
 *  Returns how many entries were added (0 on every run after the first). */
export async function liftBuiltinCatalogOverlays(): Promise<{ colours: number; shapes: number }> {
  const raw = readBuiltinCatalogue();
  if (!raw) return { colours: 0, shapes: 0 };
  const builtin = unionCatalogue(raw);

  const colours = await getSetting<Record<string, Colour[]>>(KEYS.extraColours, {});
  let addedColours = 0;
  for (const [cat, list] of Object.entries(builtin.colours)) {
    if (!Array.isArray(list)) continue;
    const cur = colours[cat] ?? [];
    const missing = list.filter((c) => c && c.id && !cur.some((x) => x.id === c.id));
    if (missing.length) {
      colours[cat] = [...missing.map((c) => ({ id: c.id, name: c.name, hex: c.hex || '#CCCCCC' })), ...cur];
      addedColours += missing.length;
    }
  }
  if (addedColours) await setSetting(KEYS.extraColours, colours);

  const shapes = await getSetting<Record<string, string[]>>(KEYS.extraShapes, {});
  let addedShapes = 0;
  for (const [cat, list] of Object.entries(builtin.shapes)) {
    if (!Array.isArray(list)) continue;
    const cur = shapes[cat] ?? [];
    const missing = list.filter((s) => s && !cur.includes(s));
    if (missing.length) {
      shapes[cat] = [...missing, ...cur];
      addedShapes += missing.length;
    }
  }
  // Prune shapes retired from a category. The lift is otherwise add-only, so a
  // shape seeded on an earlier boot lingers forever; this removes deprecated
  // ones from the stored overlay (and the admin panel) for good.
  const DEPRECATED_SHAPES: Record<string, string[]> = { laser: ['invisible-square', 'leaf'] };
  let prunedShapes = 0;
  for (const [cat, dead] of Object.entries(DEPRECATED_SHAPES)) {
    const cur = shapes[cat];
    if (!Array.isArray(cur)) continue;
    const kept = cur.filter((s) => !dead.includes(s));
    if (kept.length !== cur.length) { shapes[cat] = kept; prunedShapes += cur.length - kept.length; }
  }
  if (addedShapes || prunedShapes) await setSetting(KEYS.extraShapes, shapes);

  return { colours: addedColours, shapes: addedShapes };
}
