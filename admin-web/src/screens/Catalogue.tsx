import { useEffect, useMemo, useState } from 'react';
import { adminApi, GRADE_SCOPED, type ProductImages } from '../lib/api';
import { SHAPE_NAMES } from '../lib/shapeNames';

// ---------------------------------------------------------------------------
// Catalogue (lookbook) export.
//
// Builds a professional, print-ready PDF catalogue from the ACTUAL photos the
// operator has uploaded (GET /admin/product-images) — one section per category,
// organised grade → colour → shape, photo + name only. The shop's real
// Category → Grade → Colour flow (with display names) comes from the price
// snapshot's `__catalog__`; shape names from SHAPE_NAMES. The operator picks
// which categories to include (one, a few, or all) and clicks Generate — a new
// window opens with the styled catalogue and the browser's own "Save as PDF".
//
// It runs in the operator's browser, which can see the live photos, so nothing
// here depends on any server-side rendering.
// ---------------------------------------------------------------------------

type SnapColour = { id: string; name: string; hex?: string };
type SnapCat = { name: string; grades: { id: string; name: string }[]; coloursByGrade: Record<string, SnapColour[]> };
type Catalog = Record<string, SnapCat>;

type Item = { shape: string; shapeName: string; url: string };
type ColourGroup = { colour: string; colourName: string; hex?: string; items: Item[] };
type GradeGroup = { grade: string; gradeName: string; colours: ColourGroup[] };
type CatGroup = { cat: string; catName: string; grades: GradeGroup[]; count: number };

const titleCase = (s: string) =>
  (s || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Company block shown on the catalogue's back page (kept in sync with the shop footer).
const COMPANY = {
  name: 'Eurostar Gem Technologies Inc.',
  offices: [
    ['Corporate office', '101/103 Krishna Bhavan, Dhanji Street, Mumbai'],
    ['Branch', '65A Kachwala Building, Dhanji Street, Mumbai'],
    ['Jaipur Branch', '4th Floor, Goswami Bhavan, Jaipur 302016'],
    ['Hong Kong office', 'Unit No. 901, Hing Wah Center, Tokwawan, Kowloon, Hong Kong'],
  ] as [string, string][],
  contact: 'Trade desk · +91 77100 65480 · info@eurostar.com',
};

function buildCatalogue(cat__: Catalog, images: ProductImages): CatGroup[] {
  // cat -> grade -> colour -> shape -> url
  const tree: Record<string, Record<string, Record<string, Record<string, string>>>> = {};
  for (const [key, url] of Object.entries(images)) {
    if (!url) continue;
    const parts = key.split('|');
    const cat = parts[0];
    let grade = '';
    let colour = '';
    let shape = '';
    if (GRADE_SCOPED[cat] && parts.length === 4) {
      grade = parts[1];
      colour = parts[2];
      shape = parts[3];
    } else if (parts.length === 3) {
      colour = parts[1];
      shape = parts[2];
    } else {
      continue;
    }
    if (!cat || !colour || !shape) continue;
    // Skip document/certificate slots (e.g. "_warranty", "_cert"); keep the
    // Rajkot "_packet" product photos.
    if (colour.startsWith('_') && colour !== '_packet') continue;
    (tree[cat] ??= {});
    (tree[cat][grade] ??= {});
    (tree[cat][grade][colour] ??= {});
    tree[cat][grade][colour][shape] = url;
  }

  const colourName = (cat: string, colour: string): { name: string; hex?: string } => {
    if (colour === '_packet') return { name: 'Packet' };
    const cbg = cat__[cat]?.coloursByGrade || {};
    for (const g of Object.keys(cbg)) {
      const hit = cbg[g].find((c) => c.id === colour);
      if (hit) return { name: hit.name, hex: hit.hex };
    }
    return { name: titleCase(colour) };
  };
  const gradeName = (cat: string, grade: string): string => {
    if (!grade) return '';
    return cat__[cat]?.grades.find((g) => g.id === grade)?.name || titleCase(grade);
  };
  const shapeName = (shape: string): string => SHAPE_NAMES[shape] || titleCase(shape);

  const out: CatGroup[] = [];
  for (const cat of Object.keys(tree)) {
    // Keep grades in the shop's own order where known, else alphabetical.
    const knownOrder = (cat__[cat]?.grades || []).map((g) => g.id);
    const gradeIds = Object.keys(tree[cat]).sort(
      (a, b) => (knownOrder.indexOf(a) + 1 || 99) - (knownOrder.indexOf(b) + 1 || 99) || a.localeCompare(b),
    );
    const grades: GradeGroup[] = [];
    let count = 0;
    for (const grade of gradeIds) {
      const colours: ColourGroup[] = [];
      for (const colour of Object.keys(tree[cat][grade])) {
        const items: Item[] = Object.keys(tree[cat][grade][colour])
          .map((shape) => ({ shape, shapeName: shapeName(shape), url: tree[cat][grade][colour][shape] }))
          .sort((a, b) => a.shapeName.localeCompare(b.shapeName));
        if (!items.length) continue;
        const cn = colourName(cat, colour);
        colours.push({ colour, colourName: cn.name, hex: cn.hex, items });
        count += items.length;
      }
      colours.sort((a, b) => a.colourName.localeCompare(b.colourName));
      if (colours.length) grades.push({ grade, gradeName: gradeName(cat, grade), colours });
    }
    if (grades.length) out.push({ cat, catName: cat__[cat]?.name || titleCase(cat), grades, count });
  }
  out.sort((a, b) => a.catName.localeCompare(b.catName));
  return out;
}

// The professional print document (self-contained HTML + CSS).
function catalogueHtml(groups: CatGroup[]): string {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const card = (colourName: string, it: Item) => `
    <figure class="pc">
      <div class="pc-img"><img src="${esc(it.url)}" alt="${esc(colourName + ' ' + it.shapeName)}" loading="lazy"
        onerror="this.parentNode.classList.add('pc-broken');this.remove();"/></div>
      <figcaption><b>${esc(colourName)}</b><span>${esc(it.shapeName)}</span></figcaption>
    </figure>`;

  const sections = groups
    .map(
      (g) => `
    <section class="cat">
      <div class="cat-head"><h2>${esc(g.catName)}</h2><div class="cat-rule"></div>
        <p class="cat-sub">${g.count} design${g.count === 1 ? '' : 's'}</p></div>
      ${g.grades
        .map(
          (gr) => `
        <div class="grade">
          ${gr.gradeName ? `<h3>${esc(gr.gradeName)}</h3>` : ''}
          ${gr.colours
            .map(
              (c) => `
            <div class="colour">
              <h4><i class="sw" style="background:${esc(c.hex || '#ccc')}"></i>${esc(c.colourName)}</h4>
              <div class="grid">${c.items.map((it) => card(c.colourName, it)).join('')}</div>
            </div>`,
            )
            .join('')}
        </div>`,
        )
        .join('')}
    </section>`,
    )
    .join('');

  const offices = COMPANY.offices
    .map(([label, addr]) => `<p><b>${esc(label)}:</b><br/>${esc(addr)}</p>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Eurostar — Product Catalogue</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #1a2420; background: #fff; }
  h1,h2,h3,h4 { font-family: Georgia, 'Times New Roman', serif; margin: 0; }
  .bar { position: sticky; top: 0; z-index: 9; display: flex; gap: 12px; align-items: center;
    background: #0e3a2e; color: #f4efe1; padding: 12px 18px; }
  .bar button { background: #d8b25c; color: #14231d; border: 0; border-radius: 8px; padding: 10px 18px;
    font-weight: 700; font-size: 14px; cursor: pointer; }
  .bar span { font-size: 13px; opacity: .9; }
  /* Cover */
  .cover { min-height: 92vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; background: linear-gradient(160deg,#0e3a2e,#14231d); color: #f4efe1; page-break-after: always; }
  .cover img { width: 260px; filter: brightness(0) invert(1); opacity: .96; margin-bottom: 26px; }
  .cover h1 { font-size: 52px; letter-spacing: .04em; }
  .cover .gold { color: #e2ba64; }
  .cover .rule { width: 90px; height: 2px; background: #d8b25c; margin: 22px 0; }
  .cover p { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; opacity: .85; }
  .cover .date { margin-top: 34px; font-size: 13px; letter-spacing: .18em; opacity: .7; }
  /* Category sections */
  .cat { page-break-before: always; padding: 6px 2px 20px; }
  .cat-head { margin: 6px 0 18px; }
  .cat-head h2 { font-size: 32px; color: #0e3a2e; }
  .cat-rule { width: 64px; height: 3px; background: #d8b25c; margin: 8px 0 4px; }
  .cat-sub { margin: 0; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #8a8578; }
  .grade { margin: 14px 0 6px; }
  .grade h3 { font-size: 20px; color: #14231d; border-left: 3px solid #d8b25c; padding-left: 10px; margin: 16px 0 6px; }
  .colour { break-inside: avoid; margin: 10px 0 16px; }
  .colour h4 { font-size: 15px; color: #2a382f; display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-weight: 700; }
  .sw { width: 13px; height: 13px; border-radius: 50%; display: inline-block; box-shadow: inset 0 0 0 1px rgba(0,0,0,.15); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .pc { break-inside: avoid; margin: 0; border: 1px solid #ece7da; border-radius: 10px; overflow: hidden; background: #fbf9f3; }
  .pc-img { aspect-ratio: 1/1; background: #f0ece1; display: flex; align-items: center; justify-content: center; }
  .pc-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pc.pc-broken .pc-img::after { content: 'No image'; color: #b7b0a1; font-size: 11px; }
  .pc figcaption { padding: 7px 9px 9px; }
  .pc figcaption b { display: block; font-size: 12.5px; color: #14231d; }
  .pc figcaption span { display: block; font-size: 11px; color: #8a8578; margin-top: 1px; }
  /* Back page */
  .back { page-break-before: always; min-height: 88vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center; }
  .back img { width: 200px; margin-bottom: 20px; }
  .back h3 { font-size: 24px; color: #0e3a2e; margin-bottom: 4px; }
  .back .offices { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 40px; max-width: 620px; margin: 22px auto 0; text-align: left; }
  .back .offices p { font-size: 13px; line-height: 1.5; color: #40483f; margin: 0; }
  .back .offices b { color: #0e3a2e; }
  .back .contact { margin-top: 26px; font-size: 13px; color: #40483f; }
  @media print { .bar { display: none !important; } .cover, .back { min-height: 96vh; } }
</style></head>
<body>
  <div class="bar">
    <button onclick="window.print()">🖨  Save as PDF</button>
    <span>Press this, then choose “Save as PDF” as the printer. (Tip: turn on “Background graphics” for the colours.)</span>
  </div>

  <section class="cover">
    <img src="/assets/eurostar-logo.png" alt="Eurostar"/>
    <p>Eurostar Gem Technologies Inc.</p>
    <h1>PRODUCT <span class="gold">CATALOGUE</span></h1>
    <div class="rule"></div>
    <p>Fine &amp; Synthetic Gemstones</p>
    <div class="date">${esc(today)}</div>
  </section>

  ${sections}

  <section class="back">
    <img src="/assets/eurostar-logo.png" alt="Eurostar"/>
    <h3>${esc(COMPANY.name)}</h3>
    <div class="offices">${offices}</div>
    <div class="contact">${esc(COMPANY.contact)}<br/>www.eurostargems.com</div>
  </section>
</body></html>`;
}

export function Catalogue() {
  const [images, setImages] = useState<ProductImages>({});
  const [cat__, setCat__] = useState<Catalog>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const [snap, imgs] = await Promise.all([adminApi.priceSnapshot(), adminApi.productImages()]);
        const cc = ((snap as Record<string, unknown>)?.__catalog__ ?? {}) as Catalog;
        setCat__(cc);
        setImages(imgs ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load your catalogue data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => buildCatalogue(cat__, images), [cat__, images]);

  // Default: everything with photos is selected.
  useEffect(() => {
    if (groups.length) setPicked(Object.fromEntries(groups.map((g) => [g.cat, true])));
  }, [groups]);

  const selected = groups.filter((g) => picked[g.cat]);
  const totalPhotos = selected.reduce((n, g) => n + g.count, 0);

  const generate = () => {
    if (!selected.length) {
      alert('Pick at least one category to include.');
      return;
    }
    const html = catalogueHtml(selected);
    const w = window.open('', '_blank');
    if (!w) {
      alert('Please allow pop-ups for this site, then click Generate again — the catalogue opens in a new tab.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  if (loading) return <div className="ad-body"><section className="ad-card ad-card-pad ad-muted">Loading your catalogue…</section></div>;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Product catalogue (PDF)</h2>
        <p className="ad-muted">
          Make a professional PDF lookbook from the photos you have uploaded — cover, your office details, and a section
          per category organised by grade → colour → shape (photo &amp; name). Tick the categories you want (one, a few,
          or all), then Generate — it opens a print-ready page; choose <b>Save as PDF</b>.
        </p>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {groups.length === 0 ? (
        <section className="ad-card ad-card-pad ad-hint">
          No product photos found yet. Upload photos under <b>Product images</b> (and <b>Polki design photos</b>) first —
          this catalogue is built from those.
        </section>
      ) : (
        <>
          <section className="ad-card ad-card-pad" style={{ marginBottom: 16 }}>
            <div className="ad-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <strong>Categories to include</strong>
              <span className="ad-row" style={{ gap: 8 }}>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setPicked(Object.fromEntries(groups.map((g) => [g.cat, true])))}>Select all</button>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setPicked({})}>Clear</button>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10, marginTop: 14 }}>
              {groups.map((g) => (
                <label key={g.cat} className="ad-check-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--line,#e6e2d6)', borderRadius: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!picked[g.cat]} onChange={(e) => setPicked((p) => ({ ...p, [g.cat]: e.target.checked }))} />
                  <span style={{ flex: 1 }}>{g.catName}</span>
                  <span className="ad-muted" style={{ fontSize: 12 }}>{g.count}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="ad-card ad-card-pad">
            <div className="ad-row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="ad-btn ad-btn-pri" disabled={!selected.length} onClick={generate}>
                Generate catalogue ({selected.length} categor{selected.length === 1 ? 'y' : 'ies'}, {totalPhotos} photo{totalPhotos === 1 ? '' : 's'})
              </button>
              <span className="ad-muted" style={{ fontSize: 13 }}>
                Opens a new tab → click <b>🖨 Save as PDF</b> at the top. For one category, tick just that one; to combine, tick a few.
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
