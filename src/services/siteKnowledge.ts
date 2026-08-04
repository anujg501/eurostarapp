import fs from 'fs';
import path from 'path';
import { prisma } from '../db';
import { getSetting, KEYS } from './settings';

// What Mira knows about the shop.
//
// Mira's answers used to come from whatever the office had typed into her
// Knowledge box, so anything the shop actually sells — a new colour, a retired
// shape, today's price — was invisible to her unless somebody remembered to
// retype it. This builds that knowledge from the live catalogue instead: the
// categories, grades, colours and shapes on sale, the published prices, which
// products have photos, and the site copy.
//
// It is deliberately a digest, not a dump. The price mirror alone is ~7,400
// rows; sending that with every message would cost more than the answer is
// worth and bury the useful part. So the prompt gets a compact map of what
// exists, and `focusFor()` adds the exact rows for whatever the customer just
// asked about.

const SNAPSHOT_PATH = path.join(process.cwd(), 'docs', 'price-snapshot.json');
// How long a built digest is reused. Short enough that an edit shows up on its
// own within a minute even if nothing signals us; `bumpSiteKnowledge()` makes
// the usual case instant.
const TTL_MS = 60_000;
// Where the shop is served from, for the one place a full web address is
// useful (staff pasting a photo into WhatsApp). In the chat itself Mira sends
// the <<IMG>> marker instead, so a link is never shown to a customer — and a
// wrong host here can no longer produce a dead link on a test machine.
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || 'https://eurostargems.com').replace(/\/+$/, '');

type SnapshotRow = { rate: number; pcs: number; size: string; base?: boolean };
type CatSnapshot = Record<string, Record<string, SnapshotRow>>;

interface Built {
  at: number;
  version: number;
  digest: string;
  snapshot: CatSnapshot;
  catNames: Record<string, string>;
}

let cache: Built | null = null;
let version = 0;

/** Called whenever the office saves something that changes the shop. */
export function bumpSiteKnowledge(): void {
  version++;
  cache = null;
}

function readSnapshot(): CatSnapshot {
  try {
    const raw = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) as Record<string, unknown>;
    delete raw.__catalog__;
    return raw as CatSnapshot;
  } catch {
    return {};
  }
}

// Per-piece rates run to paise (₹2.25, ₹4.05), so rounding them to whole rupees
// misquotes a stone by up to a tenth of its price. Keep the decimals where they
// carry meaning and drop them on the larger numbers, where they do not.
const money = (n: number) =>
  n < 100 ? `₹${Number(n.toFixed(2))}` : `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Human label for a category's unit of sale. */
function unitLabel(unit: string): string {
  if (unit === 'ct') return 'per carat';
  if (unit === 'pkt') return 'per piece, sold by the packet';
  if (unit === 'strip') return 'per strip';
  if (unit === 'set') return 'per set';
  return 'per piece';
}

async function build(): Promise<Built> {
  const [cats, products, extraColours, extraShapes, extraGrades, productImages, colourThumbs, content, rules, soldOut] =
    await Promise.all([
      prisma.category.findMany({ where: { hidden: false }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({ where: { hidden: false }, select: { cat: true, stock: true } }),
      getSetting(KEYS.extraColours, {} as Record<string, { id: string; name: string }[]>),
      getSetting(KEYS.extraShapes, {} as Record<string, string[]>),
      getSetting(KEYS.gradeOverrides, {} as Record<string, { id: string; name: string }[]>),
      getSetting(KEYS.productImages, {} as Record<string, string>),
      getSetting(KEYS.colourThumbs, {} as Record<string, string>),
      getSetting(KEYS.siteContent, {} as Record<string, unknown>),
      getSetting(KEYS.storeRules, {} as Record<string, unknown>),
      prisma.soldOut.findMany({ where: { soldOut: true }, select: { key: true } }),
    ]);

  const snapshot = readSnapshot();
  const catNames: Record<string, string> = {};
  const skuCount: Record<string, number> = {};
  products.forEach((p) => { skuCount[p.cat] = (skuCount[p.cat] ?? 0) + 1; });

  const lines: string[] = [];
  for (const c of cats) {
    catNames[c.key] = c.name;
    const rows = snapshot[c.key] ?? {};
    const keys = Object.keys(rows);

    // Colours and shapes actually priced, plus anything the office added.
    const colours = new Set<string>();
    const shapes = new Set<string>();
    let min = Infinity;
    let max = 0;
    for (const k of keys) {
      const [, colour, shape] = k.split('|');
      if (colour) colours.add(colour);
      if (shape) shapes.add(shape);
      const r = rows[k];
      if (r && r.rate > 0) { min = Math.min(min, r.rate); max = Math.max(max, r.rate); }
    }
    (extraColours[c.key] ?? []).forEach((x) => x?.id && colours.add(x.id));
    (extraShapes[c.key] ?? []).forEach((s) => s && shapes.add(s));
    const grades = (extraGrades[c.key] ?? []).map((g) => g.name).filter(Boolean);

    // Which of them the office has photographed — Mira may only offer images
    // that exist.
    const photos = Object.keys(productImages).filter((k) => k.startsWith(`${c.key}|`)).length;
    const colourPhotos = Object.keys(colourThumbs).filter((k) => k.startsWith(`${c.key}|`)).length;

    // Packet-sold categories: how many pieces come in a packet, which is what a
    // jeweller is actually buying. Ranges, because it varies by size.
    let pcsNote = '';
    if (c.unit === 'pkt') {
      const counts = keys.map((k) => rows[k]?.pcs).filter((n): n is number => !!n && n > 1);
      if (counts.length) pcsNote = `packing: ${Math.min(...counts)}–${Math.max(...counts)} pcs per packet (varies by size)`;
    }

    const bits = [
      `sold ${unitLabel(c.unit)}`,
      pcsNote,
      grades.length ? `grades: ${grades.slice(0, 8).join(', ')}` : '',
      colours.size ? `colours (${colours.size}): ${[...colours].slice(0, 24).join(', ')}` : '',
      shapes.size ? `shapes (${shapes.size}): ${[...shapes].slice(0, 24).join(', ')}` : '',
      keys.length ? `${keys.length} priced sizes, ${money(min)}–${money(max)}` : 'no published price sheet yet',
      skuCount[c.key] ? `${skuCount[c.key]} SKUs` : '',
      photos ? `${photos} product photos` : '',
      colourPhotos ? `${colourPhotos} colour photos` : '',
    ].filter(Boolean);

    lines.push(`• ${c.name} (${c.key})${c.blurb ? ` — ${c.blurb}` : ''}\n  ${bits.join(' | ')}`);
  }

  const sold = soldOut.map((s) => s.key);
  const site = content as { heroTitle?: string; heroSub?: string; footerNote?: string; businessHours?: string };
  const store = rules as { defaultPayment?: string; languages?: string[] };

  // Every image the office has uploaded, from every screen that uploads one.
  //
  // Listed compactly: the live site has ~900 product photos, and one key per
  // line would crowd out everything else in the prompt. Product photos are
  // "category|colour|shape", so they collapse to one line per colour with the
  // shapes beside it, which is both shorter and easier to read from.
  const { entries } = await imageIndex();
  const bySource: Record<string, string[]> = {};
  const shapesByPair: Record<string, string[]> = {};
  entries.forEach((e) => {
    const parts = e.key.split('|');
    if (e.source === 'product photo' && parts.length === 3) {
      const pair = `${parts[0]}|${parts[1]}`;
      (shapesByPair[pair] = shapesByPair[pair] ?? []).push(parts[2]);
      return;
    }
    (bySource[e.source] = bySource[e.source] ?? []).push(e.label);
  });
  const productLines = Object.entries(shapesByPair).map(([pair, shapes]) => `${pair}|{${shapes.join(', ')}}`);
  if (productLines.length) {
    bySource['product photo'] = [
      ...productLines.map((l) => l),
      ...(bySource['product photo'] ?? []),
    ];
  }
  const imageNote = entries.length
    ? [
        '',
        `IMAGES ON FILE (${entries.length}) — these are already uploaded and you can send any of them right now.`,
        'TO SEND ONE, put this on its own line at the very end of your message:',
        '<<IMG>>KEY<<END>>',
        'copying KEY exactly from the list below (keep the | characters). The app turns that into the actual picture in the chat.',
        'Do not paste a web address instead — a link is something to copy, and the customer asked to SEE the stone.',
        `(Outside the chat window the same photo is at ${PUBLIC_BASE}/assistant/media?key=KEY.)`,
        'You may send up to three, each in its own marker.',
        '',
        'HOW TO ANSWER A REQUEST FOR A PICTURE:',
        '1. Look through this list first. Match on the category, colour and shape the customer named — "white round laser" is the key laser|white|round.',
        '2. If there is no exact match, offer the closest thing that IS on the list and say what it shows (the colour photo, or the category photo).',
        '3. Only say a photo is not on file when nothing in this list fits. Never tell a customer the office has not uploaded something that appears below, and never invent a key that is not here.',
        '',
        'Product photos are written below as category|colour|{shape, shape, …} — expand one shape to make the key, e.g. laser|white|{round, oval} means the keys laser|white|round and laser|white|oval.',
        '',
        ...Object.entries(bySource).map(([source, labels]) => `${source} (${labels.length}): ${labels.join(' · ')}`),
      ].join('\n')
    : '';

  const digest = [
    'LIVE SHOP DATA — read from the Eurostar catalogue just now. This is the authoritative list of what exists; never invent a category, colour, shape, size or price that is not here.',
    '',
    `CATEGORIES ON SALE (${cats.length}):`,
    lines.join('\n'),
    '',
    sold.length ? `SOLD OUT right now (${sold.length}): ${sold.slice(0, 40).join(', ')}` : 'Nothing is marked sold out right now.',
    imageNote,
    site.heroTitle || site.footerNote
      ? `\nSITE COPY — headline: ${site.heroTitle ?? '(default)'} | ${site.heroSub ?? ''} | footer: ${site.footerNote ?? '(default)'} | hours: ${site.businessHours ?? '(default)'}`
      : '',
    store.languages?.length ? `Languages offered in the shop: ${store.languages.join(', ')}.` : '',
    store.defaultPayment ? `Default payment terms for a new account: ${store.defaultPayment}.` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { at: Date.now(), version, digest, snapshot, catNames };
}

async function current(): Promise<Built> {
  if (cache && cache.version === version && Date.now() - cache.at < TTL_MS) return cache;
  cache = await build();
  return cache;
}

/**
 * The map of the shop, for the system prompt.
 *
 * `images` drops the photo list, which is the bulk of it — the live site has
 * ~900 keys. Only a customer can be sent a picture, so a candidate studying for
 * their exam was carrying that whole list for nothing, and paying for it in the
 * seconds they waited for an answer.
 */
export async function siteDigest(opts: { images?: boolean } = {}): Promise<string> {
  const full = (await current()).digest;
  if (opts.images !== false) return full;
  const cut = full.indexOf('\nIMAGES ON FILE (');
  return cut === -1 ? full : full.slice(0, cut).trimEnd();
}

/**
 * The exact priced rows for whatever the customer just asked about.
 *
 * The digest says which colours and shapes exist; this answers "how much is a
 * 3 mm round in Alpanite Green" with the real number rather than a guess. Only
 * the categories named in the message are looked at, and the result is capped —
 * a question is not a licence to send the whole price list.
 */
export async function focusFor(message: string, limit = 60): Promise<string> {
  const { snapshot, catNames } = await current();
  const text = message.toLowerCase();
  if (!text.trim()) return '';

  // "3 mm", "3mm", "3.00 mm" and "10x8" are all the same stone to a customer.
  // Without this the sheet's "3.00 mm" never matched a question about 3 mm, so
  // the right row was in the pile but nothing pushed it to the top.
  const normSize = (s: string) =>
    s.toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '').replace(/mm$/, '')
      .replace(/(\d+(?:\.\d*?[1-9])?)\.?0*$/, '$1');
  const askedSizes = new Set(
    (text.match(/\d+(?:\.\d+)?\s*(?:[x×*]\s*\d+(?:\.\d+)?)?\s*mm|\b\d+(?:\.\d+)?\s*[x×*]\s*\d+(?:\.\d+)?\b/g) || [])
      .map(normSize)
  );

  type Hit = { score: number; line: string };
  const hits: Hit[] = [];

  for (const catKey of Object.keys(snapshot)) {
    const name = (catNames[catKey] ?? catKey).toLowerCase();
    // Match on the category key or its name — "laser", "Eurostar Laser Engraved".
    const named = text.includes(catKey) || name.split(/\s+/).some((w) => w.length > 3 && text.includes(w));
    if (!named) continue;

    const rows = snapshot[catKey];
    for (const key of Object.keys(rows)) {
      const [grade, colour, shape, size] = key.split('|');
      const r = rows[key];
      // Rank by how much of the question a row answers, so the exact stone is
      // at the top of the list rather than wherever the sheet happened to put it.
      let score = 0;
      if (askedSizes.has(normSize(size)) || askedSizes.has(normSize(r.size))) score += 4;
      if (shape && text.includes(shape.toLowerCase())) score += 2;
      if (colour && text.includes(colour.toLowerCase())) score += 2;
      if (grade && text.includes(grade.toLowerCase())) score += 1;

      hits.push({
        score,
        line: `${catNames[catKey] ?? catKey}${grade ? ` · ${grade}` : ''}${colour ? ` · ${colour}` : ''} · ${shape} ${r.size} = ${money(r.rate)}${r.pcs > 1 ? ` (${r.pcs} pcs/packet)` : ''}${r.base ? ' [base rate]' : ''}`,
      });
    }
  }

  if (!hits.length) return '';
  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, limit);
  const exact = top.some((h) => h.score >= 4);

  return [
    '',
    '',
    `LIVE PRICES for what was asked — quote these exactly, they are today's published rates${exact ? ' (the first lines are the exact size asked about)' : ''}:`,
    top.map((h) => h.line).join('\n'),
    hits.length > limit ? `…and ${hits.length - limit} more sizes in this category — ask the customer to narrow it down rather than guessing.` : '',
  ]
    .filter((s) => s !== '')
    .join('\n');
}

/**
 * The training material, for a candidate who is studying.
 *
 * Mira on the candidate's screen was answering as if she were talking to a
 * wholesale buyer: she had the shop catalogue and none of the course, so
 * "explain module 2" or "test me on grades" got nothing useful. This is the
 * published training — titles, summaries, checklists — plus the shape of the
 * assessment and where this candidate has got to.
 *
 * The question bank is deliberately absent. Handing a candidate the paper they
 * are about to sit is not tutoring, and the answer key never leaves the server.
 */
export async function studyDigest(candidateUserId?: string): Promise<string> {
  const [modules, cfg] = await Promise.all([
    prisma.trainingModule.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, summary: true, checklist: true, videoDuration: true, mandatory: true },
    }),
    getSetting<{ count: number; passPct: number; durationMin: number }>('eurostar-lms-test-config-v1', {
      count: 15,
      passPct: 70,
      durationMin: 15,
    }),
  ]);

  const lines = modules.map((m, i) => {
    let list: string[] = [];
    try { list = JSON.parse(m.checklist || '[]'); } catch { list = []; }
    return [
      `${i + 1}. ${m.title}${m.videoDuration ? ` (${m.videoDuration})` : ''}${m.mandatory ? '' : ' — optional'}`,
      m.summary ? `   ${m.summary}` : '',
      list.length ? `   Key points: ${list.join('; ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  });

  // Where this candidate actually is, so encouragement is not invented.
  let mine = '';
  if (candidateUserId) {
    // A candidate is matched to their login by phone, the same way the rest of
    // the candidate routes resolve ownership.
    const user = await prisma.user.findUnique({ where: { id: candidateUserId }, select: { phone: true } }).catch(() => null);
    const me = user?.phone
      ? await prisma.candidate.findFirst({
          where: { phone: user.phone },
          select: { name: true, stage: true, score: true, data: true },
        }).catch(() => null)
      : null;
    if (me) {
      let blob: Record<string, any> = {};
      try { blob = JSON.parse(me.data || '{}'); } catch { blob = {}; }
      const watched = Array.isArray(blob.watched) ? blob.watched.length : 0;
      mine = [
        '',
        `THIS CANDIDATE: ${me.name} · stage ${me.stage}${me.score != null ? ` · last score ${me.score}%` : ''}.`,
        `Videos watched: ${watched} of ${modules.length}.`,
        blob.testConsumed ? 'They have already used their one attempt at the assessment.' : 'They have not sat the assessment yet.',
      ].join('\n');
    }
  }

  return [
    'TRAINING MATERIAL — the published course, read just now. You are this candidate\'s tutor: explain these modules, answer questions about the products and the job, and quiz them to check understanding.',
    '',
    modules.length ? lines.join('\n') : 'No training modules have been published yet.',
    '',
    `THE ASSESSMENT: ${cfg.count} questions, pass mark ${cfg.passPct}%, ${cfg.durationMin} minutes, ONE attempt, and it must be finished in a single sitting. The clock keeps running if they leave the app; it holds only while they are off the test screen.`,
    'You do not have the question paper and must never guess at it or supply answers to it. If asked for the questions, say you cannot give those out, then offer to quiz them on the material instead — that is what actually prepares them.',
    mine,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * What the back office looks like right now — the CRM or the LMS.
 *
 * Mira on a staff screen was answering about the shop while the person in front
 * of her was working a pipeline: how many orders are waiting, who has not paid,
 * which candidates cleared the test. This reads that too, so she can answer
 * from the same desk the operator is sitting at.
 *
 * Deliberately never mixed into the shop's own knowledge: it is customer names,
 * phone numbers and hiring records, and a customer must never be answered from
 * it. The caller decides the scope and the route checks the signed-in role
 * before asking for either.
 */
export async function opsDigest(scope: 'crm' | 'lms'): Promise<string> {
  if (scope === 'crm') {
    const [customers, orders, payments, rfqs, reps, leads, carts] = await Promise.all([
      prisma.customer.count(),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true }, _sum: { grand: true } }),
      prisma.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true } }),
      prisma.rfq.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.user.findMany({
        where: { role: 'rep' },
        select: { name: true, repId: true, region: true, commissionPct: true, monthlyTarget: true, active: true },
      }),
      // Leads track progress as a numbered stage, not a status string.
      prisma.lead.groupBy({ by: ['stage'], _count: { _all: true } }).catch(() => []),
      prisma.cart.count({ where: { status: 'active' } }),
    ]);

    const money = (n: number | null | undefined) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
    return [
      'LIVE BACK-OFFICE DATA (CRM) — read just now. Staff only; never repeat customer names or numbers to anyone who is not staff.',
      `Customers on the master: ${customers}. Open carts: ${carts}.`,
      `Orders: ${orders.map((o) => `${o._count?._all ?? 0} ${o.status} (${money(o._sum?.grand)})`).join(', ') || 'none yet'}.`,
      `Payments: ${payments.map((p) => `${p._count?._all ?? 0} ${p.status} (${money(p._sum?.amount)})`).join(', ') || 'none yet'}.`,
      `RFQ enquiries: ${rfqs.map((r) => `${r._count?._all ?? 0} ${r.status}`).join(', ') || 'none open'}.`,
      Array.isArray(leads) && leads.length
        ? `Leads by pipeline stage: ${leads.map((l) => `stage ${l.stage}: ${l._count?._all ?? 0}`).join(', ')}.`
        : '',
      reps.length
        ? `Sales reps (${reps.length}): ${reps
            .map((r) => `${r.name}${r.repId ? ` [${r.repId}]` : ''}${r.region ? ` · ${r.region}` : ''} · ${r.commissionPct ?? 4}% · target ${r.monthlyTarget ?? 50}${r.active ? '' : ' · SUSPENDED'}`)
            .join('; ')}.`
        : 'No reps set up yet.',
      '',
      'WHAT THE CRM DOES, so you can guide staff: Customers (payment terms, suspend a login), Reps & commission, Relation-Pipeline, RFQ Enquiries (quote back), Franchise Requests, Reports, Attendance, Field Visits, Leads, Customer Database, Rep Broadcast, All carts, Payments (verify or reject a receipt). Credit terms and discounts are approved by the office only.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const [cands, modules, questions] = await Promise.all([
    prisma.candidate.findMany({ select: { stage: true, score: true, repId: true, data: true } }),
    prisma.trainingModule.count(),
    prisma.testQuestion.count({ where: { active: true } }),
  ]);
  const cfg = await getSetting<{ count: number; passPct: number; durationMin: number }>(
    'eurostar-lms-test-config-v1',
    { count: 15, passPct: 70, durationMin: 15 }
  );

  const byStage: Record<string, number> = {};
  let awaiting = 0;
  let hired = 0;
  for (const c of cands) {
    byStage[c.stage ?? 'registered'] = (byStage[c.stage ?? 'registered'] ?? 0) + 1;
    if (c.repId) hired++;
    let blob: Record<string, unknown> = {};
    try { blob = JSON.parse(c.data || '{}'); } catch { blob = {}; }
    const took = !!(blob.testConsumed || (Array.isArray(blob.attempts) && blob.attempts.length));
    if (c.stage === 'recommended' && took && (c.score ?? 0) >= cfg.passPct) awaiting++;
  }

  return [
    'LIVE RECRUITMENT DATA (LMS) — read just now. Staff only; candidate details never leave this screen.',
    `Candidates: ${cands.length} — ${Object.entries(byStage).map(([s, n]) => `${n} ${s}`).join(', ')}.`,
    `Awaiting approval (cleared the test and actually sat it): ${awaiting}. Hired with a Rep ID: ${hired}.`,
    `Training modules published: ${modules}. Question bank: ${questions} active questions.`,
    `Assessment: ${cfg.count} questions, pass mark ${cfg.passPct}%, ${cfg.durationMin} minutes, one attempt.`,
    '',
    'WHAT THE LMS DOES, so you can guide staff: Candidates (unlock training, unlock the test, grant a re-test), Screening (book an interview, record the outcome), Approval Queue (Approve & Hire issues a permanent Rep ID and a temporary Sales App password), Training Content, Question Bank, Reports, Notifications. A hired candidate then completes onboarding — confidentiality undertaking, photo, Aadhaar/PAN, bank details.',
  ].join('\n');
}

/**
 * Every image the office has uploaded, wherever it was uploaded from.
 *
 * The photos live in five different settings maps plus Mira's own library,
 * because they were added by five different screens. Mira could only see two of
 * them, so she told customers a photo "hasn't been provided" while it was
 * sitting in the media library all along. This is the one list, and it is what
 * both the prompt and /assistant/media resolve against.
 */
export async function imageIndex(): Promise<{
  entries: { key: string; label: string; source: string }[];
  byKey: Map<string, string>;
}> {
  const [products, colours, swatches, cats, shapes, library] = await Promise.all([
    getSetting<Record<string, string>>(KEYS.productImages, {}),
    getSetting<Record<string, string>>(KEYS.colourThumbs, {}),
    getSetting<Record<string, string>>(KEYS.colourSwatches, {}),
    getSetting<Record<string, string>>(KEYS.catThumbs, {}),
    getSetting<Record<string, string>>(KEYS.shapeThumbs, {}),
    getSetting<{ id: string; name: string; desc?: string; data: string }[]>(KEYS.miraImages, []),
  ]);

  const entries: { key: string; label: string; source: string }[] = [];
  const byKey = new Map<string, string>();

  const add = (key: string, label: string, source: string, data: string) => {
    if (!key || !data) return;
    if (!byKey.has(key)) {
      byKey.set(key, data);
      entries.push({ key, label, source });
    }
  };

  Object.entries(products).forEach(([k, v]) => add(k, k, 'product photo', v));
  Object.entries(colours).forEach(([k, v]) => add(k, k, 'colour photo', v));
  Object.entries(swatches).forEach(([k, v]) => add(k, k, 'colour swatch', v));
  Object.entries(cats).forEach(([k, v]) => add(k, k, 'category photo', v));
  Object.entries(shapes).forEach(([k, v]) => add(k, k, 'shape photo', v));
  // The office's own library, addressed by the name they gave it.
  (Array.isArray(library) ? library : []).forEach((im) => {
    if (im?.name) add(im.name, `${im.name}${im.desc ? ` — ${im.desc}` : ''}`, 'media library', im.data);
    if (im?.id) add(im.id, im.name || im.id, 'media library', im.data);
  });

  return { entries, byKey };
}

/** For diagnostics: how big the digest is and when it was built. */
export async function siteKnowledgeStats() {
  const c = await current();
  return { builtAt: new Date(c.at).toISOString(), version: c.version, digestChars: c.digest.length };
}
