/*
 * Eurostar Fine — price engine.
 *
 * Every stone price comes from the trade shop's own price mirror
 * (/price-snapshot.json, regenerated whenever a price sheet changes), so the
 * jewellery site can never drift from eurostargems.com/shop. Nothing is typed
 * twice.
 *
 *   Gold    = gold weight (g) × 24K rate × purity      (14K 58.5%, 18K 75%)
 *   Making  = gold weight (g) × ₹1,500                 (minimum ₹2,500/piece)
 *   Stones  = Σ shop price per stone × markup          (progressive: 10× / 6× / 4×)
 *   GST     = 3% of the above
 *
 * Works in the browser (window.FinePricing) and in Node (for the checker).
 */
(function (root) {
  const CONFIG = {
    // Fallback only — the live value comes from gold-rate.json.
    gold24PerGram: 14940,
    rateAsOf: '2026-10-01',
    purity: { 14: 0.585, 18: 0.75 },
    // 18K alloy is denser than 14K, so the same design weighs more in 18K.
    // Design weights are entered for 14K; 18K weight = 14K weight × this.
    density18over14: 1.18,
    makingPerGram: 1500,
    minMakingPerPiece: 2500,
    gst: 0.03,
    // Progressive stone markup, applied to the shop price of ONE stone (or one
    // navratna set). Works like tax slabs, so a dearer stone never ends up
    // cheaper than a slightly cheaper one.
    markupSlabs: [
      { upTo: 500, x: 10 },
      { upTo: 3000, x: 6 },
      { upTo: Infinity, x: 4 },
    ],
    roundTo: 100,
  };

  // The Eurostar gems the jewellery line is allowed to use, with honest labels.
  // cat/grade/colour are the trade shop's own ids (see __catalog__ in the snapshot).
  const GEMS = {
    moissanite:   { label: 'Moissanite', note: 'DEF colourless, VVS', cat: 'moissanite', grade: 'def', colour: '', unit: 'ct', hex: '#EEF2F6' },
    ruby:         { label: 'Lab-grown Ruby', note: 'Pigeon-blood red', cat: 'labgrown', grade: 'labgrown', colour: 'pigeon', hex: '#9B1B30' },
    emerald:      { label: 'Lab-grown Emerald', note: 'Zambian green', cat: 'labgrown', grade: 'labgrown', colour: 'zambia', hex: '#0F6B52' },
    sapphire:     { label: 'Lab-grown Blue Sapphire', note: 'Royal blue', cat: 'labgrown', grade: 'labgrown', colour: 'royalblue', hex: '#1F3C93' },
    pink:         { label: 'Lab-grown Pink Sapphire', note: 'Fairy pink', cat: 'labgrown', grade: 'labgrown', colour: 'fairypink', hex: '#E7A3B5' },
    hotpink:      { label: 'Lab-grown Hot Pink Sapphire', note: 'Vivid pink', cat: 'labgrown', grade: 'labgrown', colour: 'hotpink', hex: '#D2386E' },
    padparadscha: { label: 'Lab-grown Padparadscha', note: 'Sunset peach-pink', cat: 'labgrown', grade: 'labgrown', colour: 'padparadscha', hex: '#E98D62' },
    alexandrite:  { label: 'Lab-grown Alexandrite', note: 'Colour-change violet', cat: 'labgrown', grade: 'labgrown', colour: 'alexander', hex: '#6F78B6' },
    lavender:     { label: 'Lab-grown Lavender Sapphire', note: 'Soft lilac', cat: 'labgrown', grade: 'labgrown', colour: 'lavender', hex: '#9D80C4' },
    paraiba:      { label: 'Lab-grown Paraiba', note: 'Neon teal', cat: 'labgrown', grade: 'labgrown', colour: 'pariba', hex: '#1FA9A0' },
    canary:       { label: 'Lab-grown Yellow Sapphire', note: 'Canary yellow', cat: 'labgrown', grade: 'labgrown', colour: 'canary', hex: '#E5C232' },
    opal:         { label: 'Lab-created Opal', note: 'White with rainbow fire', cat: 'labopal', grade: 'a', colour: 'white', hex: '#EDE9DF' },
    evileye:      { label: 'Evil Eye', note: 'Hand-painted cobalt eye', cat: 'evileye', grade: '', colour: '', hex: '#2A6FDB' },
    mopClover:    { label: 'Mother of Pearl Clover', note: 'Natural white MOP', cat: 'clover', grade: 'natural', colour: 'natmop', hex: '#F1ECE2' },
    onyxClover:   { label: 'Black Onyx Clover', note: 'Natural onyx', cat: 'clover', grade: 'natural', colour: 'onyx', hex: '#232322' },
    agateClover:  { label: 'Green Agate Clover', note: 'Natural agate', cat: 'clover', grade: 'natural', colour: 'greenagate', hex: '#2E8C5C' },
    carnClover:   { label: 'Red Agate Clover', note: 'Natural carnelian-red agate', cat: 'clover', grade: 'natural', colour: 'redagate', hex: '#A2402F' },
    pinkClover:   { label: 'Pink MOP Clover', note: 'Natural pink mother of pearl', cat: 'clover', grade: 'natural', colour: 'pinkmop', hex: '#EAB2C0' },
    mop:          { label: 'Mother of Pearl', note: 'Natural white MOP', cat: 'mop', grade: 'white', colour: '', hex: '#F1ECE2' },
    blackMop:     { label: 'Black Mother of Pearl', note: 'Natural black MOP', cat: 'mop', grade: 'black', colour: '', hex: '#2B2D33' },
    pearl:        { label: 'Freshwater-look Pearl', note: 'Created pearl, white', cat: 'pearls', grade: 'created', colour: 'white', hex: '#F6F1E7' },
    navratna:     { label: 'Navratna set', note: 'Nine created gems', cat: 'navratna', grade: 'created', colour: '', unit: 'set', hex: '#9B1B30' },
    navratnaNat:  { label: 'Navratna set (natural)', note: 'Nine natural gems', cat: 'navratna', grade: 'natural', colour: '', unit: 'set', hex: '#9B1B30' },
    polki:        { label: 'Polki', note: 'Uncut flat-table polki', cat: 'polki', grade: 'white-regular', colour: '', hex: '#ECE7DC' },
  };

  const GOLD_COLOURS = {
    yellow: { label: 'Yellow gold', light: '#F3DE9A', mid: '#D3AE5B', dark: '#9C7A34' },
    rose:   { label: 'Rose gold',   light: '#F4D2C0', mid: '#D49A82', dark: '#9E6450' },
    white:  { label: 'White gold',  light: '#F7F7F5', mid: '#CFD0CF', dark: '#8E9091' },
  };

  let snapshot = null;
  let weights = null;
  let gold24 = CONFIG.gold24PerGram;
  let rateAsOf = CONFIG.rateAsOf;

  function init(data) {
    snapshot = data.snapshot;
    weights = data.weights;
    if (data.goldRate && data.goldRate.rate24 > 0) {
      gold24 = data.goldRate.rate24;
      rateAsOf = data.goldRate.asOf || rateAsOf;
    }
  }

  // "6.50 mm" / "7×9 mm" → "6.5mm" / "7x9mm" — the snapshot's key form.
  function normSize(s) {
    return String(s).toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '')
      .replace(/(\d+\.\d*?)0+(?=\D|$)/g, '$1').replace(/\.(?=\D|$)/g, '');
  }

  // Shop price of ONE stone (or one navratna set). null when the shop has no
  // price for that exact gem/shape/size — the caller treats that as unavailable.
  function stoneCost(gemId, shape, size) {
    const g = GEMS[gemId];
    if (!g || !snapshot) return null;
    const table = snapshot[g.cat];
    if (!table) return null;
    const sz = normSize(size);
    const row = table[[g.grade, g.colour, shape, sz].join('|')];
    if (!row || !(row.rate > 0)) return null;
    if (g.unit === 'ct') {
      // Moissanite is sold per carat: one stone = ₹/ct × its carat weight.
      const w = weights && weights[shape] && weights[shape][sz];
      return w ? row.rate * w : null;
    }
    return row.rate; // per piece (or per set for navratna)
  }

  function markup(cost) {
    let rest = cost, prev = 0, out = 0;
    for (const s of CONFIG.markupSlabs) {
      const band = Math.min(rest, s.upTo - prev);
      if (band <= 0) break;
      out += band * s.x;
      rest -= band;
      prev = s.upTo;
    }
    return out;
  }

  // Resolve a design + the customer's choices into stone lines.
  function stoneLines(design, choice) {
    const lines = [];
    for (const slot of design.stones) {
      const gemId = slot.choose ? (choice.gem || slot.choose[0]) : slot.gem;
      const gems = slot.mix || [gemId];
      // A mixed slot (rainbow band) spreads qty across its gems in turn.
      gems.forEach((gid, i) => {
        const qty = slot.mix ? Math.floor(slot.qty / gems.length) + (i < slot.qty % gems.length ? 1 : 0) : slot.qty;
        if (!qty) return;
        const cost = stoneCost(gid, slot.shape, slot.size);
        lines.push({
          gem: gid, label: GEMS[gid].label, shape: slot.shape, size: slot.size, qty,
          role: slot.role, cost, each: cost == null ? null : markup(cost),
        });
      });
    }
    return lines;
  }

  function quote(design, choice) {
    const karat = choice.karat || 14;
    const grams = design.weight14 * (karat === 18 ? CONFIG.density18over14 : 1);
    const gold = grams * gold24 * CONFIG.purity[karat];
    const making = Math.max(grams * CONFIG.makingPerGram, CONFIG.minMakingPerPiece);
    const lines = stoneLines(design, choice);
    const missing = lines.filter((l) => l.each == null);
    const stones = lines.reduce((s, l) => s + (l.each || 0) * l.qty, 0);
    const sub = gold + making + stones;
    const gst = sub * CONFIG.gst;
    const total = Math.round((sub + gst) / CONFIG.roundTo) * CONFIG.roundTo;
    return { karat, grams, gold, making, stones, lines, gst, total, missing, rate24: gold24, rateAsOf };
  }

  // Cheapest configuration (14K, cheapest centre gem) for "from ₹" labels.
  function fromPrice(design) {
    const slot = design.stones.find((s) => s.choose);
    const opts = slot ? slot.choose : [null];
    return Math.min(...opts.map((g) => quote(design, { karat: 14, gem: g }).total));
  }

  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

  root.FinePricing = { CONFIG, GEMS, GOLD_COLOURS, init, stoneCost, markup, quote, fromPrice, inr, normSize,
    get gold24() { return gold24; }, get rateAsOf() { return rateAsOf; } };
})(typeof window !== 'undefined' ? window : globalThis);
