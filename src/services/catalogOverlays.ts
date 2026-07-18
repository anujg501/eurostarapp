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

type Colour = { id: string; name: string; hex?: string };

function readBuiltinCatalogue(): { colours: Record<string, Colour[]>; shapes: Record<string, string[]> } | null {
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
    const out = vm.runInNewContext(
      code + '\n;({ colours: COLORS_BY_CATEGORY, shapes: SHAPES_BY_CATEGORY });',
      sandbox,
      { timeout: 10_000 }
    ) as { colours?: unknown; shapes?: unknown };
    if (!out || typeof out.colours !== 'object' || typeof out.shapes !== 'object') return null;
    return out as { colours: Record<string, Colour[]>; shapes: Record<string, string[]> };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Catalog overlays: could not read docs/app/data.jsx:', (e as Error).message);
    return null;
  }
}

/** Merge the storefront's built-in colours/shapes into the admin overlay maps.
 *  Returns how many entries were added (0 on every run after the first). */
export async function liftBuiltinCatalogOverlays(): Promise<{ colours: number; shapes: number }> {
  const builtin = readBuiltinCatalogue();
  if (!builtin) return { colours: 0, shapes: 0 };

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
  if (addedShapes) await setSetting(KEYS.extraShapes, shapes);

  return { colours: addedColours, shapes: addedShapes };
}
