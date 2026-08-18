import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, priceFor, laserDiscount, type PriceSnapshot, type PriceRow, type CartLine } from '../api';
import { getSnapshot } from '../priceCache';
import { theme } from '../theme';
import Mira from '../components/Mira';
import { ShopHeader, ShopFooter } from '../components/ShopChrome';

const money = (n: number) =>
  `₹${n < 100 ? Number(n.toFixed(2)) : Math.round(n).toLocaleString('en-IN')}`;

// Shape ids in the price keys are slugs; these are the names the shop uses.
const SHAPE_NAME: Record<string, string> = {
  round: 'Round', marquise: 'Marquise', oval: 'Oval', pear: 'Pear', square: 'Square',
  'invisible-square': 'Invisible Square', heart: 'Heart', 'curved-trillion': 'Curved Trillion',
  cushion: 'Cushion', 'oblong-cushion': 'Oblong Cushion', asscher: 'Asscher', radiant: 'Radiant',
  'baguette-prince': 'Baguette Prince', 'baguette-step': 'Baguette Step',
  'tapered-baguette': 'Tapered Baguette', triangle: 'Triangle', octagon: 'Octagon', leaf: 'Leaf',
  trillion: 'Trillion', star: 'Star', lily: 'Lily', plum: 'Plum', 'bridge-cut': 'Bridge Cut',
};
const shapeName = (id: string) =>
  SHAPE_NAME[id] || id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

// The cut described in a few words, under the shape's name — copied from SHAPES
// in docs/app/data.jsx so the card reads the same as the website's.
const SHAPE_NOTE: Record<string, string> = {
  round: 'Brilliant, 57 facets', oval: 'Elongated brilliant', pear: 'Teardrop',
  emerald: 'Step cut', radiant: 'Beveled rectangle', marquise: 'Boat shape',
  princess: 'Square brilliant', cushion: 'Rounded square', asscher: 'Square step',
  heart: 'Romantic cut', trillion: 'Triangular', baguette: 'Rectangular step',
  tapered: 'Tapered step cut', 'octagon-step': 'Emerald-style step cut',
  'octagon-princess': 'Octagon brilliant', 'oblong-cushion': 'Elongated cushion',
  'curved-trillion': 'Rounded triangular', fulldrilled: 'Through-drilled for stringing',
  halfdrilled: 'Half-drilled for posts & studs', undrilled: 'No hole — ready for setting',
  cabs: 'Smooth half-dome cabochon', square: 'By corner-to-corner', cube: '3-D cube',
  pearoval: 'L × W', cabochon: 'Domed', clover: 'Four-leaf motif', shell: 'Carved shell',
  bellflower: 'Floral motif', bulgari: 'Signature motif', butterfly: 'Carved butterfly',
  cutstones: 'Oval, pear, marquise, round, etc.', maniya: 'Oval ball with hole',
  'tyre-plain': 'Batti · plain finish', 'tyre-fac': 'Batti · faceted finish',
  'ballhole-plain': 'Drilled ball · plain', 'ballhole-fac': 'Drilled ball · faceted',
  'plain-beads': 'Smooth drilled round bead', 'faceted-beads': 'Faceted drilled round bead',
  'oval-maniya': 'Oval ball with hole', drops: 'Teardrop drilled bead',
};

// Categories where the grade is part of the photo's key — kept in step with
// PIMG_GRADE_SCOPED in docs/app/product-images.jsx.
const GRADE_SCOPED: Record<string, boolean> = {
  mop: true, multisapphire: true, opaque: true, labgrown: true, navratna: true,
  hollowmop: true, bracelet: true, beads: true, corundum: true, cz: true,
  pearls: true, rajkot: true, polki: true,
};

/** Wash of the colour behind a shape icon, as the web's lightenTone() does. */
function tint(hex?: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return theme.paper;
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.82);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

// Product photos, fetched once per app run and shared by every category.
let PIMGS: Record<string, string> | null = null;

// Held for the rest of the app run so re-entering a category is instant. The
// download and the copy on disk are handled by priceCache.
let CACHE: PriceSnapshot | null = null;

/**
 * Browse a category the way the website does: grade, then colour, then shape,
 * then the sizes with their rates.
 *
 * Everything comes from /price-snapshot.json — the file the shop generates from
 * its own data and pricing functions — so the app and the website quote the same
 * number. Steps a category does not need are skipped rather than shown empty:
 * Laser Engraved has one grade, so it opens on the colours.
 */
export default function CategoryScreen({ route, navigation }: any) {
  const { cat, name } = route.params as { cat: string; name: string };
  const [snap, setSnap] = useState<PriceSnapshot | null>(CACHE);
  const [err, setErr] = useState('');

  const [grade, setGrade] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);
  const [shape, setShape] = useState<string | null>(null);
  // Packets selected, keyed by size. Cleared once the lines reach the cart.
  const [qty, setQty] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);
  const [pimgs, setPimgs] = useState<Record<string, string>>(PIMGS || {});

  useEffect(() => {
    if (CACHE) { setSnap(CACHE); return; }
    let alive = true;
    getSnapshot()
      .then((s) => { CACHE = s; if (alive) setSnap(s); })
      .catch((e) => { if (alive) setErr(e?.message || 'Could not load the catalogue.'); });
    return () => { alive = false; };
  }, []);

  // The shape cards carry the same photo the website puts on them. Small next
  // to the catalogue, and shared across categories once fetched.
  useEffect(() => {
    if (PIMGS) return;
    let alive = true;
    api.productImages()
      .then((m) => { PIMGS = m || {}; if (alive) setPimgs(PIMGS); })
      .catch(() => { PIMGS = {}; });
    return () => { alive = false; };
  }, []);

  const meta = snap?.__catalog__?.[cat];
  const block: Record<string, PriceRow> | undefined = snap?.[cat];

  const grades = meta?.grades || [];
  // A single grade is not a choice — the website skips the step too.
  const gradeId = grade || (grades.length === 1 ? grades[0].id : null);

  const colours = gradeId ? meta?.coloursByGrade?.[gradeId] || [] : [];
  const colourId = colour || (colours.length === 1 ? colours[0].id : null);

  // Shapes and sizes are read from the price keys themselves, so a category
  // only ever offers what it is actually priced for.
  const shapes = useMemo(() => {
    if (!block) return [];
    // Scoped to the chosen grade and colour for the same reason the sizes are:
    // a colour is not cut in every shape the category sells, and offering one
    // it has no prices for leads to an empty pad.
    const want = [
      `${gradeId || ''}|${colourId || ''}|`,
      `${gradeId || ''}||`,
      `|${colourId || ''}|`,
      '||',
    ];
    // Shown in the shop's own order, not the order the price keys happen to
    // sit in — those are close but not the same (moissanite ships baguette and
    // tapered the other way round), which put the grid out of step with the
    // website. Anything priced but missing from the list still shows, at the end.
    const canon = meta?.shapesByGrade?.[gradeId || ''] || meta?.shapesByGrade?.[''] || [];
    const inOrder = (list: string[]) => {
      const rank = (x: string) => { const i = canon.indexOf(x); return i === -1 ? canon.length : i; };
      // Admin > Catalog is the gate, as it is on the web: a shape the office
      // removed from the category is not offered, even if a sheet still prices
      // it. With no list to go on, everything priced is shown.
      const keep = canon.length ? list.filter((x) => canon.includes(x)) : list;
      return [...keep].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    };
    for (const prefix of want) {
      const hit = [...new Set(
        Object.keys(block).filter((k) => k.startsWith(prefix)).map((k) => k.split('|')[2])
      )].filter(Boolean);
      if (hit.length) return inOrder(hit);
    }
    return [];
  }, [block, gradeId, colourId, meta]);
  const shapeId = shape || (shapes.length === 1 ? shapes[0] : null);

  // Every shape the category sells, ignoring what has been picked so far. The
  // step rail is drawn before a grade is chosen, when the scoped list above is
  // necessarily empty — using that would show "1 Grade · 2 Sizes" and then grow
  // to four steps once a grade was tapped.
  const anyShapes = useMemo(() => {
    if (!block) return 0;
    const seen = new Set<string>();
    for (const k of Object.keys(block)) {
      const sh = k.split('|')[2];
      if (sh) seen.add(sh);
    }
    return seen.size;
  }, [block]);

  // Same for the colours: a category's colours hang off the grade, so before
  // one is chosen there is nothing to count.
  const anyColours = useMemo(
    () => Object.values(meta?.coloursByGrade || {}).reduce((n, list) => Math.max(n, list.length), 0),
    [meta]
  );

  const sizes = useMemo(() => {
    if (!block || !shapeId) return [];
    // Only the sizes priced for THIS grade and colour. Matching on shape alone
    // returned every grade/colour combination the category has — 1,249 rows on
    // CZ round instead of 69 — which showed one size many times over at other
    // colours' prices, and took seconds to draw.
    //
    // Categories that price uniformly leave the grade or colour part of the key
    // empty, so the same fallback priceFor() uses is applied here: the most
    // specific set of keys that matches wins.
    const want = [
      `${gradeId || ''}|${colourId || ''}|`,
      `${gradeId || ''}||`,
      `|${colourId || ''}|`,
      '||',
    ];
    const seen = new Set<string>();
    let out: { key: string; size: string; row: PriceRow }[] = [];
    for (const prefix of want) {
      out = [];
      seen.clear();
      for (const k of Object.keys(block)) {
        if (!k.startsWith(prefix)) continue;
        const [, , sh, sizeKey] = k.split('|');
        if (sh !== shapeId || seen.has(sizeKey)) continue;
        seen.add(sizeKey);
        const row = block[k];
        out.push({ key: sizeKey, size: row.size || sizeKey, row });
      }
      if (out.length) break;
    }
    // Numeric order, so 0.9 mm does not sit after 10 mm.
    return out.sort((a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0));
  }, [block, shapeId, gradeId, colourId]);

  // How many sizes each shape actually offers at this grade and colour, so the
  // card can say "62 sizes" the way the website's does. Counted once for the
  // whole grid rather than per card.
  const sizeCounts = useMemo(() => {
    if (!block) return {} as Record<string, number>;
    const want = [
      `${gradeId || ''}|${colourId || ''}|`,
      `${gradeId || ''}||`,
      `|${colourId || ''}|`,
      '||',
    ];
    for (const prefix of want) {
      const per: Record<string, Set<string>> = {};
      for (const k of Object.keys(block)) {
        if (!k.startsWith(prefix)) continue;
        const [, , sh, sizeKey] = k.split('|');
        if (!sh) continue;
        (per[sh] = per[sh] || new Set()).add(sizeKey);
      }
      if (Object.keys(per).length) {
        return Object.fromEntries(Object.entries(per).map(([k, v]) => [k, v.size]));
      }
    }
    return {} as Record<string, number>;
  }, [block, gradeId, colourId]);

  const colourHex = colours.find((c) => c.id === colourId)?.hex;

  /** The photo filed for this shape — grade-scoped in the categories that need it. */
  const shapeArt = (s: string) => {
    const withGrade = `${cat}|${gradeId}|${colourId}|${s}`;
    const plain = `${cat}|${colourId}|${s}`;
    return (GRADE_SCOPED[cat] ? pimgs[withGrade] || pimgs[plain] : pimgs[plain] || pimgs[withGrade]) || null;
  };

  const step: 1 | 2 | 3 | 4 =
    !gradeId ? 1 : !colourId ? 2 : !shapeId ? 3 : 4;

  // What the customer has picked so far. Pieces and money are worked out from
  // the packet count, because a packet is what actually ships.
  // How this category is sold decides the arithmetic, exactly as it does on
  // the website: a carat category quotes ₹/ct and the quantity IS carats, so
  // the rate must not be multiplied by the pieces in one. Treating every
  // category as packets is what left Moissanite showing 0 pieces and ₹0.
  const unit: string = meta?.unit || 'pkt';
  const perUnit = (row: PriceRow) => (unit === 'pkt' ? (row.pcs || 0) * row.rate : row.rate);
  const picked = useMemo(() => {
    const lines = sizes
      .map((s) => ({ s, packets: qty[s.key] || 0 }))
      .filter((l) => l.packets > 0);
    const pcs = lines.reduce((a, l) => a + l.packets * (l.s.row.pcs || 0), 0);
    const net = lines.reduce((a, l) => a + l.packets * perUnit(l.s.row), 0);
    const packets = lines.reduce((a, l) => a + l.packets, 0);
    return { lines, pcs, net, packets };
  }, [sizes, qty, unit]);

  const bump = (key: string, by: number) =>
    setQty((q) => {
      const next = Math.max(0, (q[key] || 0) + by);
      const out = { ...q };
      if (next === 0) delete out[key]; else out[key] = next;
      return out;
    });

  const addToCart = async () => {
    if (!picked.lines.length || adding) return;
    setAdding(true);
    try {
      const lines: CartLine[] = picked.lines.map((l) => ({
        skuId: `${cat}-${colourId}-${shapeId}-${l.s.key}`,
        name: `${colourName} ${meta?.name || name} ${shapeName(shapeId || '')}`.trim(),
        categoryKey: cat,
        grade: gradeId || undefined,
        colour: colourId || undefined,
        shape: shapeId || undefined,
        size: l.s.size,
        unit,
        qty: l.packets,
        // The price of ONE of whatever is being counted — a packet where the
        // category sells packets, a carat where it sells carats. A packet
        // price on a carat line overcharged by the pieces in a carat.
        unitPrice: Math.round(perUnit(l.s.row)),
      }));
      await api.createCart(lines);
      setQty({});
      const summary = `${lines.length} size${lines.length > 1 ? 's' : ''} · ${picked.packets} packet${picked.packets > 1 ? 's' : ''} · ${money(picked.net)}.`;
      // Straight to checkout for anyone who is finished, or back to the pad to
      // keep adding — the same two ways on from the website's cart.
      Alert.alert('Added to cart', summary, [
        { text: 'Keep browsing', style: 'cancel' },
        { text: 'Checkout', onPress: () => navigation.navigate('Checkout') },
      ]);
    } catch (e: any) {
      Alert.alert('Could not add to cart', e?.message || 'Please try again.');
    } finally { setAdding(false); }
  };

  // Counted across the whole category, so the rail shows the same steps from
  // the first screen to the last instead of growing as choices are made.
  const rail = [
    grades.length > 1 && { n: 1, label: 'Grade' },
    anyColours > 1 && { n: 2, label: 'Colour' },
    anyShapes > 1 && { n: 3, label: 'Shape' },
    { n: 4, label: 'Sizes & carats' },
  ].filter(Boolean) as { n: number; label: string }[];

  const gradeName = grades.find((g) => g.id === gradeId)?.name || '';
  const colourName = colours.find((c) => c.id === colourId)?.name || '';

  const back = () => {
    if (step === 4 && shapes.length > 1) { setShape(null); return; }
    if (step === 3 && colours.length > 1) { setColour(null); return; }
    if (step >= 2 && grades.length > 1) { setGrade(null); return; }
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <ShopHeader navigation={navigation} current="Home" />

      {err ? (
        <Text style={styles.err}>{err}</Text>
      ) : !snap ? (
        <ActivityIndicator color={theme.emerald} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          {/* Breadcrumb */}
          <View style={styles.trail}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.crumb}>Home</Text>
            </TouchableOpacity>
            <Feather name="chevron-right" size={13} color={theme.meta} />
            <Text style={[styles.crumb, styles.crumbOn]} numberOfLines={1}>
              {meta?.name || name}
            </Text>
            {!!colourName && step > 2 && (
              <>
                <Feather name="chevron-right" size={13} color={theme.meta} />
                <Text style={[styles.crumb, styles.crumbOn]} numberOfLines={1}>{colourName}</Text>
              </>
            )}
          </View>

          {/* Step rail */}
          <View style={styles.rail}>
            {rail.map((rs, i) => {
              const idx = i + 1;
              const cur = rs.n === step;
              const done = step > rs.n;
              return (
                <React.Fragment key={rs.n}>
                  {i > 0 && <View style={styles.railLine} />}
                  <View style={styles.railStep}>
                    <View style={[styles.dot, (cur || done) && styles.dotOn]}>
                      <Text style={[styles.dotTxt, (cur || done) && styles.dotTxtOn]}>{idx}</Text>
                    </View>
                    <Text style={[styles.railLabel, cur && styles.railLabelOn]} numberOfLines={1}>{rs.label}</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          <Text style={styles.eyebrow}>
            {[meta?.name || name, gradeName, step > 2 ? colourName : ''].filter(Boolean).join(' · ').toUpperCase()}
          </Text>

          {step === 1 && (
            <>
              <Text style={styles.h1}>Choose a grade</Text>
              <Text style={styles.lede}>{grades.length} grades in this category.</Text>
              <Grid>
                {grades.map((g) => (
                  <Card key={g.id} onPress={() => setGrade(g.id)}>
                    <Text style={styles.cardName}>{g.name}</Text>
                  </Card>
                ))}
              </Grid>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.h1}>Choose a colour</Text>
              <Text style={styles.lede}>
                {colours.length} colours available in this grade. Select the tone you want to order.
              </Text>
              <BackLink label={grades.length > 1 ? 'Change grade' : 'Back to categories'} onPress={back} />
              <Grid>
                {colours.map((c) => (
                  <Card key={c.id} onPress={() => setColour(c.id)}>
                    <View style={[styles.swatch, { backgroundColor: c.hex || theme.paper }]} />
                    <Text style={styles.cardName}>{c.name}</Text>
                  </Card>
                ))}
              </Grid>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.h1}>Choose a shape</Text>
              <Text style={styles.lede}>Pick a shape to see its sizes and pricing.</Text>
              <BackLink label={colours.length > 1 ? 'Change colour' : 'Change grade'} onPress={back} />
              <Grid>
                {shapes.map((s) => {
                  const art = shapeArt(s);
                  const n = sizeCounts[s] || 0;
                  const note = SHAPE_NOTE[s];
                  return (
                    <Card key={s} onPress={() => setShape(s)}>
                      {/* The photo if the office uploaded one, otherwise a wash
                          of the chosen colour — the web draws a shape icon here,
                          which needs an SVG library this app does not carry. */}
                      <View style={[styles.shapeArt, { backgroundColor: tint(colourHex) }]}>
                        {art ? (
                          <Image source={{ uri: art }} style={styles.shapeImg} resizeMode="cover" />
                        ) : (
                          <Text style={[styles.shapeGlyph, { color: colourHex || theme.meta }]}>
                            {shapeName(s).slice(0, 1)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.cardName}>{shapeName(s)}</Text>
                      <Text style={styles.shapeMeta}>
                        {[n ? `${n} ${n === 1 ? 'size' : 'sizes'}` : '', note].filter(Boolean).join(' · ')}
                      </Text>
                    </Card>
                  );
                })}
              </Grid>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.h1}>
                {[colourName, meta?.name === 'Eurostar Laser Engraved' ? 'Laser' : '', shapeName(shapeId || '')]
                  .filter(Boolean).join(' ')}
              </Text>
              <Text style={styles.lede}>
                Ordered by the packet · priced per piece
                {cat === 'laser' ? (
                  <Text style={styles.ledeStrong}>
                    {' · '}{colourName}{shapeId === 'round' ? ' · tiered discount by size' : ' · 21% (fancy shapes)'}
                  </Text>
                ) : null}
              </Text>
              <BackLink label={shapes.length > 1 ? 'Change shape' : 'Change colour'} onPress={back} />

              {sizes.map((s) => {
                const row = priceFor(block, gradeId || '', colourId || '', shapeId || '', s.key) || s.row;
                const mm = parseFloat(s.size) || 0;
                // Only Laser publishes a list price and a saving; for the rest
                // the snapshot rate IS the price, and inventing a "list" to
                // strike through would be a discount that does not exist.
                const disc = cat === 'laser' ? laserDiscount(shapeId || '', mm) : 0;
                const list = disc > 0 ? row.rate / (1 - disc) : 0;
                const packets = qty[s.key] || 0;
                const lineTotal = packets * perUnit(row);
                return (
                  <View key={s.key} style={[styles.padRow, packets > 0 && styles.padRowOn]}>
                    <View style={styles.padHead}>
                      <Text style={styles.padSize}>
                        {s.size.replace(/\s*mm$/i, '')}<Text style={styles.padUnit}> mm</Text>
                      </Text>
                      {disc > 0 && <Text style={styles.discPill}>Disc {Math.round(disc * 100)}%</Text>}
                    </View>

                    <View style={styles.priceRow}>
                      {disc > 0 && <Text style={styles.list}>List {money(list)}</Text>}
                      <Text style={styles.net}>Net {money(row.rate)}</Text>
                    </View>

                    {!!row.pcs && (
                      <Text style={styles.packetNote}>
                        {unit === 'pkt' ? '1 packet = ' + row.pcs.toLocaleString('en-IN') + ' pieces' : row.pcs.toLocaleString('en-IN') + ' pcs / ' + unit}
                      </Text>
                    )}

                    <View style={styles.qtyRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.qtyLabel}>{unit === 'ct' ? 'ORDER QTY' : unit === 'pkt' ? 'PACKETS TO ORDER' : 'PIECES TO ORDER'}</Text>
                        <View style={styles.stepper}>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => bump(s.key, -1)}>
                            <Feather name="minus" size={16} color={theme.ink2} />
                          </TouchableOpacity>
                          <Text style={styles.stepVal}>{packets}</Text>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => bump(s.key, +1)}>
                            <Feather name="plus" size={16} color={theme.ink2} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.qtyLabel}>LINE TOTAL</Text>
                        <Text style={styles.lineTotal}>{lineTotal > 0 ? money(lineTotal) : '—'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              {sizes.length === 0 && <Text style={styles.empty}>No sizes are priced for this shape yet.</Text>}
            </>
          )}

          {/* The laser category's authenticity block, as on the website. */}
          {cat === 'laser' && step <= 2 && (
            <View style={styles.auth}>
              <Text style={styles.authEyebrow}>WHAT YOU'LL RECEIVE</Text>
              <Text style={styles.authTitle}>Genuine sealed Eurostar packets</Text>
              <Text style={styles.authTxt}>
                Every order ships in factory-sealed, barcoded Eurostar packets — each stone laser-marked
                and graded for Pure Brilliance. Made in Austria.
              </Text>
              <View style={styles.chips}>
                <Text style={[styles.chip, styles.chipAccent]}>● Laser-marked</Text>
                <Text style={styles.chip}>Sealed &amp; barcoded</Text>
                <Text style={styles.chip}>Made in Austria</Text>
              </View>
            </View>
          )}

          <ShopFooter />
        </ScrollView>
      )}

      {/* The running total sits above the page while sizes are being picked,
          as the website's summary bar does. */}
      {step === 4 && picked.lines.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.sumGrid}>
            <Sum label="SIZES SELECTED" value={String(picked.lines.length)} />
            {unit === 'pkt'
              ? <Sum label="TOTAL PACKETS" value={picked.packets.toLocaleString('en-IN')} />
              : <Sum label="TOTAL CARATS" value={picked.packets.toLocaleString('en-IN')} />}
            <Sum label="APPROX PIECES" value={picked.pcs.toLocaleString('en-IN')} />
            <Sum label="ORDER TOTAL (NET)" value={money(picked.net)} />
          </View>
          {/* Both actions the website's bar carries, and the same wording —
              the count in the label moves with the sizes picked. */}
          <View style={styles.sumActions}>
            <TouchableOpacity
              style={[styles.addBtn, adding && { opacity: 0.6 }]}
              onPress={addToCart}
              disabled={adding}
            >
              {adding ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Feather name="shopping-bag" size={15} color="#fff" />
                  <Text style={styles.addTxt}>
                    Add {picked.lines.length} size{picked.lines.length === 1 ? '' : 's'} to order
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setQty({})} disabled={adding}>
              <Text style={styles.clearTxt}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Mira role="customer" section={`${meta?.name || name} — browse`} />
    </View>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => <View style={styles.grid}>{children}</View>;

const Card = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>{children}</TouchableOpacity>
);

const Sum = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.sumCell}>
    <Text style={styles.sumLabel}>{label}</Text>
    <Text style={styles.sumValue}>{value}</Text>
  </View>
);

const BackLink = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.backLink} onPress={onPress}>
    <Feather name="arrow-left" size={15} color={theme.ink} />
    <Text style={styles.backLinkTxt}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 110, width: '100%', maxWidth: 620, alignSelf: 'center' },

  trail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  crumb: { fontSize: 12.5, color: theme.meta },
  crumbOn: { color: theme.ink, fontWeight: '600' },

  rail: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  railStep: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  railLine: { flex: 1, height: 1, backgroundColor: theme.border, marginHorizontal: 8 },
  dot: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface,
  },
  dotOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  dotTxt: { fontSize: 12, fontWeight: '700', color: theme.meta },
  dotTxtOn: { color: '#fff' },
  railLabel: { fontSize: 12, color: theme.meta, flexShrink: 1 },
  railLabelOn: { color: theme.ink, fontWeight: '700' },

  eyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color: theme.meta },
  // The storefront sets step headings in the serif face.
  h1: { fontFamily: 'serif', fontSize: 28, color: theme.ink, marginTop: 8, letterSpacing: -0.3 },
  lede: { fontSize: 14, color: theme.meta, marginTop: 8, lineHeight: 21 },
  ledeStrong: { color: theme.emeraldInk, fontWeight: '700' },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 16, paddingVertical: 6 },
  backLinkTxt: { fontSize: 14, fontWeight: '600', color: theme.ink },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  card: {
    width: '47.5%', minHeight: 130, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 14,
    padding: 16, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  swatch: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: 'rgba(21,19,15,0.08)' },
  cardName: { fontSize: 14, fontWeight: '600', color: theme.ink, textAlign: 'center' },

  // Shape card art, as on the website: a square tile above the name, with the
  // size count and the cut's description underneath.
  shapeArt: {
    width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  shapeImg: { width: '100%', height: '100%' },
  shapeGlyph: { fontFamily: 'serif', fontSize: 34, opacity: 0.55 },
  shapeMeta: { fontSize: 11.5, color: theme.meta, textAlign: 'center', marginTop: 4, lineHeight: 16 },

  // One card per size — the website's order pad.
  padRow: {
    marginTop: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 14, padding: 16,
  },
  padRowOn: { borderColor: theme.emerald },
  padHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // Sizes are set in a mono face on the web so the columns line up.
  padSize: { flex: 1, fontFamily: 'monospace', fontSize: 19, fontWeight: '700', color: theme.ink },
  padUnit: { fontSize: 13, fontWeight: '400', color: theme.meta },
  discPill: {
    fontSize: 11.5, fontWeight: '700', color: theme.emeraldInk, backgroundColor: theme.emeraldSoft,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden',
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  list: { fontSize: 13.5, color: theme.meta, textDecorationLine: 'line-through' },
  net: { fontSize: 17, fontWeight: '800', color: theme.ink },
  packetNote: {
    fontSize: 12.5, color: theme.meta, marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: theme.divider,
  },

  qtyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 12 },
  qtyLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: theme.meta, marginBottom: 8 },
  stepper: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderWidth: 1, borderColor: theme.border, borderRadius: 10, backgroundColor: theme.paper,
  },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  stepVal: { minWidth: 40, textAlign: 'center', fontSize: 15, fontWeight: '700', color: theme.ink },
  lineTotal: { fontSize: 16, fontWeight: '800', color: theme.emeraldInk },

  // Sticky summary
  summary: {
    position: 'absolute', left: 12, right: 12, bottom: 84,
    backgroundColor: theme.ink, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  sumGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  sumCell: { width: '50%', marginBottom: 12 },
  sumLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: 'rgba(253,250,242,0.62)' },
  sumValue: { fontSize: 19, fontWeight: '800', color: '#FDFAF2', marginTop: 3 },
  sumActions: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  clearBtn: {
    justifyContent: 'center', paddingHorizontal: 22, borderRadius: 10,
    backgroundColor: 'rgba(253,250,242,0.10)', borderWidth: 1, borderColor: 'rgba(253,250,242,0.28)',
  },
  clearTxt: { color: theme.onDark, fontSize: 14.5, fontWeight: '700' },
  addBtn: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: theme.emerald, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  addTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  empty: { fontSize: 13, color: theme.meta, paddingVertical: 16 },

  auth: {
    marginTop: 26, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
    borderRadius: 16, padding: 18,
  },
  authEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color: theme.emeraldInk },
  authTitle: { fontFamily: 'serif', fontSize: 22, color: theme.ink, marginTop: 8 },
  authTxt: { fontSize: 13.5, color: theme.meta, marginTop: 8, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: {
    fontSize: 12, color: theme.ink2, backgroundColor: theme.paper,
    borderWidth: 1, borderColor: theme.border, borderRadius: 999,
    paddingHorizontal: 11, paddingVertical: 6, overflow: 'hidden',
  },
  chipAccent: { backgroundColor: theme.emeraldSoft, color: theme.emeraldInk, borderColor: theme.emeraldSoft },

  err: { color: theme.ruby, fontSize: 13, padding: 18 },
});
