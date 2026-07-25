// data.jsx — Eurostar Gemstones sample data (sourced from live site)
// All data is for prototyping; prices are realistic INR wholesale rates per piece.

const CATEGORIES = [
  { id: 'laser', name: 'Eurostar Laser Engraved', short: 'Laser Engraved',
    blurb: 'Each stone bearing the Eurostar crest on the table.',
    skipGrade: true,
    count: 640 },
  { id: 'moissanite', name: 'Moissanite Diamonds', short: 'Moissanite',
    blurb: 'DEF white & fancy color, VVS clarity. GRA-certified. Verifiable on the website.',
    count: 1240 },
  { id: 'alpanite', name: 'Alpanite Stones', short: 'Alpanite',
    blurb: 'Proprietary synthetic stones in a full colour range. 100% wax castable.',
    count: 480 },
  { id: 'multisapphire', name: 'Multi Sapphires', short: 'Multi Sapphires',
    blurb: 'Natural & lab-grown Multi Sapphire strips.',
    count: 820 },
  { id: 'cabochon', name: 'Cabochons', short: 'Cabochons',
    blurb: 'Smooth-domed, unfaceted stones cut to size.',
    count: 360 },
  { id: 'pearls', name: 'Pearls', short: 'Pearls',
    blurb: 'Natural China freshwater pearls & created pearls — wide collection.',
    count: 540 },
  { id: 'highdensity', name: 'High Density (HD) Zirconia', short: 'High Density',
    blurb: 'Dense CZ for casting — holds setting under heat. More weight for lesser thickness.',
    count: 1180 },
  { id: 'corundum', name: 'Synthetic Corrundums', short: 'Corrundum',
    blurb: 'Synthetic / lab-grown gemstones with wide variety.',
    count: 760 },
  { id: 'labgrown', name: 'Lab Grown / Created', short: 'Lab Grown',
    blurb: 'Gemstones with IGI certificate & natural inclusions like real gemstones.',
    count: 2110 },
  { id: 'labopal', name: 'Lab Created Opals', short: 'Lab Opals',
    blurb: 'Synthetic opal — varied colours across a wide spectrum.',
    count: 240 },
  { id: 'opaque', name: 'Opaque Stones', short: 'Opaque',
    blurb: 'Red & green opaque stones that give the effect of natural gemstones.',
    count: 410 },
  { id: 'beads', name: 'Beads', short: 'Beads',
    blurb: 'Faceted & smooth beads by the strand.',
    count: 720 },
  { id: 'cz', name: 'Color Cubic Zirconias', short: 'Color CZ',
    blurb: 'Calibrated CZ in 80+ shades. Heat-stable.',
    count: 4860 },
  { id: 'whitecz', name: 'White Round Cubic Zirconia', short: 'White Round CZ',
    blurb: 'Calibrated white round CZ — heat-stable, fully calibrated.',
    count: 980 },
  { id: 'whitefancy', name: 'White Fancy Shapes', short: 'White Fancy',
    blurb: 'Calibrated white CZ in fancy cuts — heat-stable, fully calibrated.',
    count: 760 },
  { id: 'mop', name: 'Mother of Pearl / Synthetic', short: 'MOP',
    blurb: 'Natural & synthetic MOP, polished and cut to spec.',
    count: 380 },
  { id: 'navratna', name: 'Navratnas', short: 'Navratna',
    blurb: 'Nine-gem astrological sets, certified matched.',
    count: 95 },
  { id: 'clover', name: 'Clover', short: 'Clover',
    blurb: 'Four-leaf clover motifs in natural & synthetic stones.',
    count: 240 },
  { id: 'icecut', name: 'Ice Cut Stones', short: 'Ice Cut',
    blurb: 'Frosted ice-cut stones with a soft matte sparkle.',
    count: 160 },
  { id: 'ourosa', name: 'Ourosa', short: 'Ourosa', skipGrade: true,
    blurb: 'Ourosa stones — sold by the packet of 10 gross (1,440 pcs).',
    count: 120 },
  { id: 'coral', name: 'Milky Corals & Olives', short: 'Milky Corals & Olives',
    blurb: 'Milky coral & olive colours in a wide range of shapes, sizes and heights.',
    skipGrade: true,
    count: 180 },
  { id: 'polki', name: 'Polki', short: 'Polki',
    blurb: 'Uncut polki in white, kundan & samosa foil.',
    count: 140 },
  { id: 'evileye', name: 'Evil Eye', short: 'Evil Eye', skipGrade: true,
    blurb: 'Real MOP with evil-eye motif, across shapes.',
    count: 90 },
  { id: 'bracelet', name: 'Fancy Jewellery Bracelets', short: 'Bracelets',
    blurb: 'Rolex-style & Cartier-style fashion bracelets.',
    count: 60 },
  { id: 'hollowmop', name: 'Hollow Shapes MOP', short: 'Hollow MOP',
    blurb: 'Hollow mother-of-pearl shapes in white & black onyx.',
    count: 120 },
  { id: 'labwhitecorundum', name: 'Lab White Corundum', short: 'Lab White Corundum', skipGrade: true,
    blurb: 'Lab-grown white corundum across calibrated shapes.',
    count: 110 },
  { id: 'alex', name: 'Lab Grown Alexandrite', short: 'Alexandrite', skipGrade: true,
    blurb: 'Colour-change lab alexandrite across shapes.',
    count: 85 },
  { id: 'rajkot', name: 'Rajkot Mass Produced Zirconia', short: 'Rajkot Zirconia',
    blurb: 'Mass-produced white & colour zirconia — ordered & priced by the packet.',
    count: 0 },
];

const SHAPES = [
  { id: 'round',    name: 'Round',    note: 'Brilliant, 57 facets' },
  { id: 'oval',     name: 'Oval',     note: 'Elongated brilliant' },
  { id: 'pear',     name: 'Pear',     note: 'Teardrop' },
  { id: 'emerald',  name: 'Emerald',  note: 'Step cut' },
  { id: 'radiant',  name: 'Radiant',  note: 'Beveled rectangle' },
  { id: 'marquise', name: 'Marquise', note: 'Boat shape' },
  { id: 'princess', name: 'Princess', note: 'Square brilliant' },
  { id: 'cushion',  name: 'Cushion',  note: 'Rounded square' },
  { id: 'asscher',  name: 'Asscher',  note: 'Square step' },
  { id: 'heart',    name: 'Heart',    note: 'Romantic cut' },
  { id: 'trillion', name: 'Trillion', note: 'Triangular' },
  { id: 'baguette', name: 'Baguette', note: 'Rectangular step' },
  { id: 'tapered', name: 'Tapered Baguette', note: 'Tapered step cut' },
  { id: 'octagon-step', name: 'Octagon Step', note: 'Emerald-style step cut' },
  { id: 'octagon-princess', name: 'Octagon Princess', note: 'Octagon brilliant' },
  { id: 'oblong-cushion', name: 'Oblong Cushion', note: 'Elongated cushion' },
  { id: 'curved-trillion', name: 'Curved Trillion', note: 'Rounded triangular' },
  { id: 'fulldrilled', name: 'Full Drilled', note: 'Through-drilled for stringing' },
  { id: 'halfdrilled', name: 'Half Drilled', note: 'Half-drilled for posts & studs' },
  { id: 'undrilled', name: 'Undrilled', note: 'No hole — ready for setting' },
  { id: 'cabs', name: 'Cabs', note: 'Smooth half-dome cabochon' },
  { id: 'square', name: 'Square', note: 'By corner-to-corner' },
  { id: 'cube', name: 'Cube', note: '3-D cube' },
  { id: 'pearoval', name: 'Pear / Oval', note: 'L × W' },
  { id: 'cabochon', name: 'Cabochon', note: 'Domed' },
  { id: 'clover', name: 'Clover', note: 'Four-leaf motif' },
  { id: 'shell', name: 'Shell', note: 'Carved shell' },
  { id: 'bellflower', name: 'Bell Flower', note: 'Floral motif' },
  { id: 'bulgari', name: 'Bulgari Motif', note: 'Signature motif' },
  { id: 'cutstones',      name: 'Cut Stones',               note: 'Oval, pear, marquise, round, etc.', subShapes: ['round','oval','pear','marquise','square','octagon-step','heart','trillion'] },
  { id: 'maniya',         name: 'Maniya',                   note: 'Oval ball with hole' },
  { id: 'tyre-plain',     name: 'Tyre Beads (Batti) · Plain',    note: 'Batti · plain finish' },
  { id: 'tyre-fac',       name: 'Tyre Beads (Batti) · Faceted',  note: 'Batti · faceted finish' },
  { id: 'ballhole-plain', name: 'Ball with Hole · Plain',        note: 'Drilled ball · plain' },
  { id: 'ballhole-fac',   name: 'Ball with Hole · Faceted',      note: 'Drilled ball · faceted' },
  { id: 'plain-beads',    name: 'Plain Beads',                   note: 'Smooth drilled round bead' },
  { id: 'faceted-beads',  name: 'Faceted Beads',                 note: 'Faceted drilled round bead' },
  { id: 'oval-maniya',    name: 'Oval Maniya',                   note: 'Oval ball with hole' },
  { id: 'drops',          name: 'Drops',                         note: 'Teardrop drilled bead' },
  { id: 'butterfly', name: 'Butterfly', note: 'Carved butterfly' },
  { id: 'flower5', name: '5-Petal Flower', note: 'Drilled flower' },
  { id: 'star', name: 'Star', note: '14 mm star' },
  { id: 'dholki', name: 'Dholki', note: 'Drum bead' },
  { id: 'tile', name: 'Tile', note: 'Flat tile' },
  { id: 'triangle', name: 'Triangle', note: 'Three-sided' },
  { id: 'oblong', name: 'Oblong Cushion', note: 'Elongated cushion' },
  { id: 'hexagon', name: 'Hexagon', note: 'Six-sided' },
];

const TONES = [
  { id: 'def-white',  name: 'DEF White',    color: '#F2EFE8', meta: 'Colorless · D-F' },
  { id: 'royal-blue', name: 'Royal Blue',   color: '#1E3A8A', meta: 'Sapphire family' },
  { id: 'emperor-green', name: 'Emperor Green', color: '#0E5C4A', meta: 'Emerald family' },
  { id: 'pigeon-blood',  name: 'Pigeon Blood',  color: '#8B1E2E', meta: 'Ruby family' },
  { id: 'canary',     name: 'Canary',       color: '#E2B43A', meta: 'Yellow sapphire' },
  { id: 'fairy-pink', name: 'Fairy Pink',   color: '#E6A4B4', meta: 'Pink sapphire' },
  { id: 'lavender',   name: 'Lavender',     color: '#9C7DC2', meta: 'Purple corundum' },
  { id: 'tsavourite', name: 'Tsavourite',   color: '#3E8E4F', meta: 'Garnet green' },
  { id: 'rubylite',   name: 'Rubylite',     color: '#B43A5C', meta: 'Pink tourmaline' },
  { id: 'cornflower', name: 'Cornflower',   color: '#5B7BC4', meta: 'Blue sapphire' },
];

// Product catalog — 18 SKUs across categories
const PRODUCTS = [
  { id: 'EUR-MOI-0107', name: 'Moissanite DEF White',  cat: 'moissanite', tone: 'def-white',
    shape: 'round',    size: '6.5 mm',  clarity: 'VVS', price: 1850, unit: 'per pc',
    moq: 10, stock: 'in', stockCount: 482, badge: 'Bestseller',
    desc: 'GRA-certified D-E-F colour, VVS clarity. Hearts & arrows precision cut.' },
  { id: 'EUR-MOI-0203', name: 'Moissanite Oval Brilliant', cat: 'moissanite', tone: 'def-white',
    shape: 'oval',     size: '7×5 mm',  clarity: 'VVS', price: 2140, unit: 'per pc',
    moq: 6,  stock: 'in', stockCount: 178 },
  { id: 'EUR-MOI-0412', name: 'Moissanite Princess', cat: 'moissanite', tone: 'def-white',
    shape: 'princess', size: '5 mm',    clarity: 'VVS', price: 1650, unit: 'per pc',
    moq: 10, stock: 'in', stockCount: 304 },
  { id: 'EUR-LAB-0518', name: 'Royal Blue Sapphire', cat: 'labgrown', tone: 'royal-blue',
    shape: 'oval',     size: '8×6 mm',  clarity: 'Eye-clean', price: 980, unit: 'per pc',
    moq: 12, stock: 'in', stockCount: 96, badge: 'New' },
  { id: 'EUR-LAB-0621', name: 'Emperor Green Emerald', cat: 'labgrown', tone: 'emperor-green',
    shape: 'emerald',  size: '7×5 mm',  clarity: 'Eye-clean', price: 1120, unit: 'per pc',
    moq: 12, stock: 'in', stockCount: 64 },
  { id: 'EUR-LAB-0724', name: 'Pigeon Blood Ruby', cat: 'labgrown', tone: 'pigeon-blood',
    shape: 'cushion',  size: '6 mm',    clarity: 'AAA',  price: 1280, unit: 'per pc',
    moq: 10, stock: 'low', stockCount: 18 },
  { id: 'EUR-LAB-0810', name: 'Canary Yellow Sapphire', cat: 'labgrown', tone: 'canary',
    shape: 'round',    size: '5 mm',    clarity: 'AAA',  price: 740, unit: 'per pc',
    moq: 20, stock: 'in', stockCount: 220 },
  { id: 'EUR-LAB-0911', name: 'Fairy Pink Sapphire', cat: 'labgrown', tone: 'fairy-pink',
    shape: 'pear',     size: '7×5 mm',  clarity: 'AAA',  price: 880, unit: 'per pc',
    moq: 10, stock: 'in', stockCount: 142 },
  { id: 'EUR-LAB-1014', name: 'Lavender Corundum', cat: 'labgrown', tone: 'lavender',
    shape: 'heart',    size: '6×6 mm',  clarity: 'AAA',  price: 940, unit: 'per pc',
    moq: 8,  stock: 'in', stockCount: 74 },
  { id: 'EUR-LAB-1108', name: 'Tsavourite Green Garnet', cat: 'labgrown', tone: 'tsavourite',
    shape: 'oval',     size: '6×4 mm',  clarity: 'AA',   price: 620, unit: 'per pc',
    moq: 20, stock: 'in', stockCount: 280 },
  { id: 'EUR-CZ-0301',  name: 'DEF White CZ Round', cat: 'cz', tone: 'def-white',
    shape: 'round',    size: '4 mm',    clarity: 'AAAAA', price: 32, unit: 'per pc',
    moq: 100, stock: 'in', stockCount: 12400 },
  { id: 'EUR-CZ-0411',  name: 'Cornflower Blue CZ', cat: 'cz', tone: 'cornflower',
    shape: 'oval',     size: '6×4 mm',  clarity: 'AAAAA', price: 48, unit: 'per pc',
    moq: 100, stock: 'in', stockCount: 8200 },
  { id: 'EUR-CZ-0512',  name: 'Pigeon Blood CZ', cat: 'cz', tone: 'pigeon-blood',
    shape: 'cushion',  size: '5 mm',    clarity: 'AAAAA', price: 38, unit: 'per pc',
    moq: 100, stock: 'in', stockCount: 6100 },
  { id: 'EUR-CZ-0715',  name: 'Rubylite CZ', cat: 'cz', tone: 'rubylite',
    shape: 'marquise', size: '8×4 mm',  clarity: 'AAAA', price: 56, unit: 'per pc',
    moq: 50, stock: 'in', stockCount: 3400 },
  { id: 'EUR-FAN-0203', name: 'Ice Cut Hexagon', cat: 'fancycut', tone: 'def-white',
    shape: 'trillion', size: '5 mm',    clarity: 'VVS', price: 420, unit: 'per pc',
    moq: 20, stock: 'low', stockCount: 36, badge: 'Trending' },
  { id: 'EUR-FAN-0309', name: 'Rose Cut Briolette', cat: 'fancycut', tone: 'def-white',
    shape: 'pear',     size: '8×5 mm',  clarity: 'SI',  price: 380, unit: 'per pc',
    moq: 20, stock: 'in', stockCount: 184 },
  { id: 'EUR-PRL-0105', name: 'Akoya Pearl Strand', cat: 'pearls', tone: 'def-white',
    shape: 'round',    size: '7-7.5 mm', clarity: 'AAA', price: 4200, unit: 'per strand',
    moq: 5,  stock: 'in', stockCount: 42 },
  { id: 'EUR-NAV-0001', name: 'Navratna Matched Set',  cat: 'navratna', tone: 'def-white',
    shape: 'round',    size: '4-6 mm',   clarity: 'Certified', price: 12800, unit: 'per set',
    moq: 1,  stock: 'low', stockCount: 9, badge: 'Curated' },
];

// Customer personas (B2B wholesale accounts)
const PERSONAS = {
  kiran: {
    id: 'kiran',
    company: 'Kiran Jewellers',
    location: 'Surat, Gujarat',
    code: 'KJ-08412',
    contact: 'Kiran Mehta',
    email: 'orders@kiranjewellers.in',
    phone: '+91 93145 88201',
    tier: 'Gold partner',
    creditLimit: 850000, // ₹
    creditUsed: 312400,
    initials: 'KM',
    pendingCount: 4,
    deliveredCount: 18,
  },
  alnoor: {
    id: 'alnoor',
    company: 'Al Noor Trading LLC',
    location: 'Dubai, UAE',
    code: 'AN-10238',
    contact: 'Faisal Al Mansouri',
    email: 'faisal@alnoor-tr.ae',
    phone: '+971 50 441 2290',
    tier: 'Platinum export',
    creditLimit: 2500000,
    creditUsed: 1820000,
    initials: 'FA',
    pendingCount: 3,
    deliveredCount: 26,
  },
};

// Orders per persona
const ORDERS = {
  kiran: [
    { id: 'EUR-2406-0218', date: '2026-05-22', status: 'pending',
      lines: [
        { pid: 'EUR-MOI-0107', qty: 40 },
        { pid: 'EUR-MOI-0203', qty: 24 },
      ],
      ship: 'DTDC · Surat hub', expected: '2026-05-29',
      paymentTerm: 'NET 30', notes: 'Calibrated, matched pairs preferred' },
    { id: 'EUR-2406-0210', date: '2026-05-20', status: 'packed',
      lines: [
        { pid: 'EUR-CZ-0411',  qty: 600 },
        { pid: 'EUR-CZ-0301',  qty: 1200 },
      ],
      ship: 'DTDC · Surat hub', expected: '2026-05-27',
      paymentTerm: 'NET 30', notes: '' },
    { id: 'EUR-2406-0193', date: '2026-05-15', status: 'shipped',
      lines: [
        { pid: 'EUR-LAB-0518', qty: 36 },
        { pid: 'EUR-LAB-0810', qty: 60 },
      ],
      ship: 'BlueDart · AWB 7281-3392', expected: '2026-05-26',
      paymentTerm: 'NET 30', notes: 'Half-set for festive line' },
    { id: 'EUR-2406-0181', date: '2026-05-10', status: 'shipped',
      lines: [
        { pid: 'EUR-FAN-0203', qty: 80 },
      ],
      ship: 'BlueDart · AWB 7281-2901', expected: '2026-05-22',
      paymentTerm: 'NET 30', notes: '' },
    { id: 'EUR-2406-0142', date: '2026-04-28', status: 'delivered',
      lines: [
        { pid: 'EUR-LAB-0621', qty: 24 },
        { pid: 'EUR-LAB-0911', qty: 40 },
      ],
      ship: 'BlueDart · Delivered', expected: '2026-05-06',
      paymentTerm: 'NET 30', notes: 'Certificate enclosed' },
    { id: 'EUR-2406-0118', date: '2026-04-15', status: 'delivered',
      lines: [
        { pid: 'EUR-CZ-0301',  qty: 2400 },
      ],
      ship: 'DTDC · Delivered', expected: '2026-04-22',
      paymentTerm: 'NET 30', notes: '' },
  ],
  alnoor: [
    { id: 'EUR-2406-0221', date: '2026-05-23', status: 'pending',
      lines: [
        { pid: 'EUR-LAB-0724', qty: 12 },
        { pid: 'EUR-LAB-0518', qty: 24 },
      ],
      ship: 'DHL Express · Mumbai → DXB', expected: '2026-06-02',
      paymentTerm: 'LC at sight', notes: 'Export — invoice & PL pending' },
    { id: 'EUR-2406-0215', date: '2026-05-21', status: 'pending',
      lines: [
        { pid: 'EUR-NAV-0001', qty: 3 },
      ],
      ship: 'DHL Express · Mumbai → DXB', expected: '2026-06-04',
      paymentTerm: 'LC at sight', notes: 'Certificate set required' },
    { id: 'EUR-2406-0207', date: '2026-05-18', status: 'packed',
      lines: [
        { pid: 'EUR-PRL-0105', qty: 18 },
      ],
      ship: 'DHL Express · Mumbai → DXB', expected: '2026-05-30',
      paymentTerm: 'LC at sight', notes: '' },
    { id: 'EUR-2406-0188', date: '2026-05-12', status: 'shipped',
      lines: [
        { pid: 'EUR-MOI-0412', qty: 80 },
        { pid: 'EUR-MOI-0107', qty: 60 },
      ],
      ship: 'DHL · AWB 81 4290 7102', expected: '2026-05-25',
      paymentTerm: 'LC at sight', notes: 'Customs cleared at DXB' },
  ],
};

// Per-product variant matrices — shapes × sizes × qualities available for a SKU family.
// These power the PDP configurator. Only the bestseller products get a full matrix;
// others have a single default variant.
// Calibrated round sizes — Eurostar's standard range, 1.00 to 8.00 mm in 0.25-step.
const ROUND_SIZES = [
  '1.00 mm','1.25 mm','1.50 mm','1.75 mm','2.00 mm','2.25 mm','2.50 mm','2.75 mm',
  '3.00 mm','3.25 mm','3.50 mm','3.75 mm','4.00 mm','4.25 mm','4.50 mm','4.75 mm',
  '5.00 mm','5.25 mm','5.50 mm','5.75 mm','6.00 mm','6.50 mm','7.00 mm','7.50 mm','8.00 mm',
];

// Approx pieces-per-carat for round brilliants (real trade chart, melee to medium)
const PCS_PER_CT = {
  '1.00 mm': 500, '1.25 mm': 220, '1.50 mm': 140, '1.75 mm': 90,
  '2.00 mm': 50,  '2.25 mm': 35,  '2.50 mm': 28,  '2.75 mm': 22,
  '3.00 mm': 16,  '3.25 mm': 13,  '3.50 mm': 11,  '3.75 mm': 9,
  '4.00 mm': 7,   '4.25 mm': 6,   '4.50 mm': 5,   '4.75 mm': 4.5,
  '5.00 mm': 4,   '5.25 mm': 3.6, '5.50 mm': 3.2, '5.75 mm': 2.8,
  '6.00 mm': 2.5, '6.50 mm': 2,   '7.00 mm': 1.6, '7.50 mm': 1.3, '8.00 mm': 1,
  // Fancy cuts roughly track the same area
  '3×2 mm': 60, '4×3 mm': 30, '5×3 mm': 22, '5×4 mm': 18, '6×4 mm': 14,
  '7×5 mm': 8,  '8×6 mm': 5,
  '4×3 mm princess': 18, '4×2 mm': 35,
};

// Per-size unit price multiplier vs the SKU's base price (base = ~6mm reference).
// Small melee stones cost much less per piece — pricing reflects real trade ratios.
const SIZE_PRICE_MULTI = {
  '1.00 mm': 0.003, '1.25 mm': 0.005, '1.50 mm': 0.008, '1.75 mm': 0.012,
  '1.10 mm': 0.0038, '1.20 mm': 0.0046, '1.30 mm': 0.0056, '1.40 mm': 0.0068,
  '1.60 mm': 0.0092, '1.70 mm': 0.0105, '1.80 mm': 0.0118, '1.90 mm': 0.0132,
  '2.00 mm': 0.020, '2.25 mm': 0.030, '2.50 mm': 0.045, '2.75 mm': 0.065,
  '3.00 mm': 0.090, '3.25 mm': 0.120, '3.50 mm': 0.160, '3.75 mm': 0.210,
  '4.00 mm': 0.280, '4.25 mm': 0.360, '4.50 mm': 0.450, '4.75 mm': 0.560,
  '5.00 mm': 0.700, '5.25 mm': 0.820, '5.50 mm': 0.940, '5.75 mm': 1.080,
  '6.00 mm': 1.250, '6.50 mm': 1.600, '7.00 mm': 2.050, '7.50 mm': 2.650, '8.00 mm': 3.500,
  '3×2 mm': 0.080, '4×3 mm': 0.180, '5×3 mm': 0.260, '5×4 mm': 0.350,
  '6×4 mm': 0.460, '7×5 mm': 0.720, '8×6 mm': 1.050, '4×2 mm': 0.110,
};
// Fancy-cut sizes — length × width pairs, also calibrated.
const OVAL_SIZES     = ['3×2 mm','4×3 mm','5×3 mm','5×4 mm','6×4 mm','7×5 mm','8×6 mm'];
const PEAR_SIZES     = ['4×3 mm','5×3 mm','5×4 mm','6×4 mm','7×5 mm','8×5 mm'];
const PRINCESS_SIZES = ['2.00 mm','2.50 mm','3.00 mm','3.50 mm','4.00 mm','4.50 mm','5.00 mm','6.00 mm','7.00 mm','8.00 mm'];
const CUSHION_SIZES  = ['3.00 mm','3.50 mm','4.00 mm','4.50 mm','5.00 mm','5.50 mm','6.00 mm','7.00 mm','8.00 mm'];
const EMERALD_SIZES  = ['4×3 mm','5×3 mm','5×4 mm','6×4 mm','7×5 mm','8×6 mm'];
const MARQUISE_SIZES = ['4×2 mm','5×2.5 mm','6×3 mm','8×4 mm'];
const HEART_SIZES    = ['3.00 mm','4.00 mm','5.00 mm','6.00 mm','7.00 mm','8.00 mm'];
const BAGUETTE_SIZES = ['2×1 mm','3×1.5 mm','3×2 mm','4×2 mm','5×3 mm','6×3 mm'];
const TRILLION_SIZES = ['3.00 mm','4.00 mm','5.00 mm','6.00 mm','7.00 mm','8.00 mm'];
const PEARL_SIZES    = ['2.00 mm','3.00 mm','4.00 mm','5.00 mm','6.00 mm','7.00 mm','8.00 mm','9.00 mm','10.00 mm'];

const FULL_SIZES = {
  round: ROUND_SIZES, oval: OVAL_SIZES, pear: PEAR_SIZES,
  princess: PRINCESS_SIZES, cushion: CUSHION_SIZES, emerald: EMERALD_SIZES,
  marquise: MARQUISE_SIZES, heart: HEART_SIZES, baguette: BAGUETTE_SIZES,
  tapered: BAGUETTE_SIZES,
  clover: ['6 mm','8 mm','10 mm','12 mm','14 mm','16 mm','18 mm','20 mm'],
  trillion: TRILLION_SIZES, asscher: PRINCESS_SIZES,
  fulldrilled: PEARL_SIZES, halfdrilled: PEARL_SIZES,
  undrilled: PEARL_SIZES, cabs: PEARL_SIZES,
  'plain-beads': ROUND_SIZES, 'faceted-beads': ROUND_SIZES,
  'oval-maniya': OVAL_SIZES, drops: PEAR_SIZES,
};

// Rajkot Mass Produced Zirconia uses its own calibrated round size list (0.10 mm steps).
const RAJKOT_SIZES = ['1.00 mm','1.10 mm','1.20 mm','1.30 mm','1.40 mm','1.50 mm','1.60 mm','1.70 mm','1.80 mm','1.90 mm','2.00 mm','2.50 mm','3.00 mm','4.00 mm'];
// Per-category size override (most categories derive sizes from FULL_SIZES[shape]).
const SIZES_BY_CATEGORY = { rajkot: RAJKOT_SIZES };

// ---------------------------------------------------------------------------
// DRILL-DOWN: Grade options per category (different for each), then shapes.
// Each grade carries a basePrice (per-pc reference) the size pad multiplies up,
// the colour tone used for the swatch, and whether it sells by carat or piece.
// ---------------------------------------------------------------------------
const GRADES_BY_CATEGORY = {
  moissanite: [
    { id: 'def', name: 'DEF White', tier: 'High quality', origin: 'Machine Cut',
      desc: 'Colourless D-E-F · VVS clarity · GRA-certified, laser-marked',
      tone: 'def-white', basePrice: 1850, unit: 'ct' },
    { id: 'gh', name: 'GH Near- White ( Deccan Mossonite)', tier: 'Commercial quality', origin: 'Slight Inclusions',
      desc: 'Near-colourless G-H · VS clarity · excellent value — slight inclusions, yellowish tone',
      tone: 'def-white', basePrice: 1180, unit: 'ct' },
  ],
  cz: [
    { id: 'excele', name: 'Excel-E', tier: 'Premium',
      desc: 'High lustre · precision cutting · suitable for fine gold & silver jewellery',
      tone: 'def-white', basePrice: 95, unit: 'ct' },
    { id: 'deccan', name: 'Deccan', tier: 'Economy',
      desc: 'Most economical · suitable for mass-produced silver & imitation jewellery',
      tone: 'def-white', basePrice: 44, unit: 'ct' },
  ],
  whitecz: [
    { id: 'elements', name: 'Elements', tier: 'Best grade',
      desc: 'American rough · precision cutting · suitable for bespoke gold & silver jewellery',
      tone: 'def-white', basePrice: 150, unit: 'ct',
      subGrades: [
        { id: 'thin',   name: 'Elements Thin',   desc: 'Thin girdle' },
        { id: 'normal', name: 'Elements Normal', desc: 'Normal weight' },
        { id: 'h',      name: 'Elements H',      desc: 'Heavy' },
        { id: 'hea',    name: 'Elements HEA',    desc: 'Extra heavy' },
      ] },
    { id: 'gq', name: 'GQ', tier: 'Gold Quality',
      desc: 'Best Chinese grade rough · precision cutting · suitable for high-quality gold & silver jewellery',
      tone: 'def-white', basePrice: 120, unit: 'ct',
      subGrades: [
        { id: 'gq',   name: 'GQ',                desc: 'Standard weight' },
        { id: 'h',    name: 'GQ H',              desc: 'Heavy' },
        { id: 'hh',   name: 'GQ Super Heavy HH', desc: 'Super heavy' },
        { id: 'hhh',  name: 'GQ HHH',            desc: 'Triple heavy' },
      ] },
    { id: 'euroaaa', name: 'Euro AAA', tier: 'High Lustre',
      desc: 'High shining · high lustre · suitable for fine gold & silver jewellery',
      tone: 'def-white', basePrice: 95, unit: 'ct' },
    { id: 'prizma', name: 'Prizma', tier: 'Value',
      desc: 'Competitive price · good quality · suitable for premium silver jewellery',
      tone: 'def-white', basePrice: 68, unit: 'ct', packetPriced: true },
    { id: 'eternal', name: 'Eternal', tier: 'Star Cut',
      desc: 'Star cut · competitive price · suitable for mass-produced silver & imitation jewellery',
      tone: 'def-white', basePrice: 48, unit: 'ct', packetPriced: true },
  ],
  whitefancy: [
    { id: 'audesus', name: 'Au Desus', tier: 'Best grade',
      desc: 'Top grade · precision cutting · suitable for bespoke gold & diamond jewellery',
      tone: 'def-white', basePrice: 165, unit: 'ct' },
    { id: 'leplus', name: 'Le Plus', tier: 'Premium',
      desc: 'High lustre · suitable for fine gold & silver jewellery',
      tone: 'def-white', basePrice: 130, unit: 'ct' },
    { id: 'excel', name: 'Excel', tier: 'Value',
      desc: 'Competitive price · good quality · suitable for premium silver jewellery',
      tone: 'def-white', basePrice: 95, unit: 'ct' },
    { id: 'deccan', name: 'Deccan', tier: 'Economy',
      desc: 'Most economical · suitable for mass-produced silver & imitation jewellery',
      tone: 'def-white', basePrice: 62, unit: 'ct', packetPriced: true },
  ],
  labgrown: [
    { id: 'labgrown', name: 'Lab Grown Beryl', tier: 'Certified', origin: 'Lab Grown',
      desc: 'IGI-certified lab-grown gemstones with natural-like inclusions, 100% wax castable',
      tone: 'royal-blue', basePrice: 980, unit: 'ct' },
    { id: 'created', name: 'Created Coloured Gemstones', tier: 'Non-Certified', origin: 'Created',
      desc: 'Created coloured gemstones — vivid, consistent colour, 100% wax castable',
      tone: 'royal-blue', basePrice: 680, unit: 'ct' },
    { id: 'labcorundum', name: 'Lab Grown Corundum', tier: 'Lab Grown', origin: 'Lab Grown',
      desc: 'IGI certificate available for Lab grown Corrundum Stones.',
      tone: 'royal-blue', basePrice: 540, unit: 'ct' },
  ],
  fancycut: [
    { id: 'vvs', name: 'VVS', tier: 'High quality',
      desc: 'Very-very-small inclusions, hand-selected',
      tone: 'def-white', basePrice: 420, unit: 'ct' },
    { id: 'vs', name: 'VS', tier: 'Commercial',
      desc: 'Very-small inclusions, great for accents',
      tone: 'def-white', basePrice: 300, unit: 'ct' },
  ],
  mop: [
    { id: 'white', name: 'White MOP', tier: 'Natural',
      desc: 'Classic white mother of pearl',
      tone: 'def-white', basePrice: 14, unit: 'pc', fromText: 'from ₹14', fromUnit: 'pc' },
    { id: 'black', name: 'Black MOP', tier: 'Natural',
      desc: 'Deep black mother of pearl',
      tone: 'def-white', basePrice: 24, unit: 'pc', fromText: 'from ₹24', fromUnit: 'pc' },
  ],
  pearls: [
    { id: 'natural', name: 'Natural', tier: 'Premium', origin: 'Natural',
      desc: 'Genuine natural pearls — top lustre, guaranteed colourfast under ultrasound',
      tone: 'def-white', basePrice: 4200, unit: 'pkt' },
    { id: 'created', name: 'Created', tier: 'Premium', origin: 'Created',
      desc: 'Created / cultured pearls — good lustre, top quality',
      tone: 'def-white', basePrice: 2800, unit: 'pkt' },
  ],
  navratna: [
    { id: 'natural', name: 'Natural Navratna', tier: 'Natural', origin: 'Natural',
      desc: 'Nine genuine astrological gemstones',
      tone: 'pigeon-blood', basePrice: 120, unit: 'pc', fromText: 'from ₹120', fromUnit: 'pc' },
    { id: 'created', name: 'Created Navratna', tier: 'Synthetic', origin: 'Created',
      desc: 'Nine created stones — round, calibrated',
      tone: 'royal-blue', basePrice: 60, unit: 'pc', fromText: 'from ₹60', fromUnit: 'pc' },
  ],
  clover: [
    { id: 'natural', name: 'Natural Stones', tier: 'Natural', origin: 'Natural',
      desc: 'Natural MOP, agate, onyx, tiger eye & more',
      tone: 'def-white', basePrice: 30, unit: 'pc', fromText: 'from ₹18', fromUnit: 'pc' },
    { id: 'synthetic', name: 'Synthetic Stones', tier: 'Synthetic', origin: 'Synthetic',
      desc: 'Synthetic turquoise, lapis, malachite, opal & coral',
      tone: 'royal-blue', basePrice: 20, unit: 'pc', fromText: 'from ₹18', fromUnit: 'pc' },
  ],
  icecut: [
    { id: 'icecut', name: 'Ice Cut', tier: 'Signature',
      desc: 'Frosted ice-cut finish — soft matte sparkle',
      tone: 'def-white', basePrice: 60, unit: 'ct', fromText: 'from ₹60', fromUnit: 'pc' },
  ],
  ourosa: [
    { id: 'ourosa', name: 'Ourosa', tier: 'Signature',
      desc: 'Ourosa stones',
      tone: 'def-white', basePrice: 90, unit: 'ct' },
  ],
  beads: [
    { id: 'ruby5',       name: 'Ruby 5 Beads',       tier: 'RUBY 5 # (TRANSPARENT)',        origin: 'Created',
      desc: 'Deep red Ruby 5 beads — plain, faceted, oval maniya and drops',
      tone: 'pigeon-blood', basePrice: 120, unit: 'ct' },
    { id: 'rubyopaque',  name: 'Ruby Opaque Beads',  tier: 'Ruby Opaque', origin: 'Created',
      desc: 'Opaque ruby-red beads in all bead forms',
      tone: 'pigeon-blood', basePrice: 90, unit: 'ct' },
    { id: 'greenopaque', name: 'Green Opaque Beads', tier: 'Green Opaque',origin: 'Created',
      desc: 'Opaque green beads — plain, faceted, oval maniya and drops',
      tone: 'emerald', basePrice: 90, unit: 'ct' },
    { id: 'greenhydro',  name: 'Green Hydro Beads',  tier: 'Green Hydro', origin: 'Created',
      desc: 'Green hydro beads — consistent colour and polish',
      tone: 'emerald', basePrice: 70, unit: 'ct' },
  ],
  laser: [
    { id: 'def', name: 'DEF White', tier: 'High quality', origin: 'Premium Quality',
      desc: 'Colourless D-E-F · VVS · Every stone bears the EUROSTAR LASER MARK on the table',
      tone: 'def-white', basePrice: 1950, unit: 'ct' },
  ],
  alpanite: [
    { id: 'aaaaa', name: 'AAA Alpanite colors', tier: 'Top quality',
      desc: 'Finest Alpanite — flawless clarity, premium saturation. Best suited for premium gold & diamond jewellery.',
      tone: 'royal-blue', basePrice: 340, unit: 'ct' },
  ],
  multisapphire: [
    { id: 'aaa', name: 'Natural Multi Sapphires', tier: 'Premium', origin: 'Natural Gemstones',
      desc: 'Vivid lab corundum, eye-clean — sold by the strip',
      tone: 'royal-blue', basePrice: 320, unit: 'strip', fromText: 'from ₹3,500', fromUnit: 'strip' },
    { id: 'aa', name: 'Synthetic Multi Sapphires', tier: 'Commercial', origin: 'Lab Grown',
      desc: 'Calibrated strips — priced per strip',
      tone: 'royal-blue', basePrice: 210, unit: 'strip' },
    { id: 'icecut', name: 'Ice Cut Multi Sapphires', tier: 'Ice Cut', origin: 'Lab Grown',
      desc: 'Crushed ice cutting on multi sapphire strips — maximum brilliance, sold by the strip',
      tone: 'royal-blue', basePrice: 420, unit: 'strip', fromText: 'from ₹4,500', fromUnit: 'strip' },
  ],
  cabochon: [
    { id: 'aaa', name: '60 % Height Cabs', tier: 'Heighted',
      desc: 'Even dome, high polish, clean surface',
      tone: 'pigeon-blood', basePrice: 90, unit: 'pc' },
    { id: 'aa', name: '30 % Height Cabs', tier: 'Flat',
      desc: 'Standard cabochon, minor variation',
      tone: 'pigeon-blood', basePrice: 60, unit: 'pc' },
  ],
  highdensity: [
    { id: 'etoile', name: 'Mercury Etoile', tier: 'Signature',
      desc: 'Thin girdle · 25% weight increase over standard zirconia',
      tone: 'def-white', basePrice: 150, unit: 'ct' },
    { id: 'h', name: 'Mercury H', tier: 'Heavy',
      desc: '10% more thickness than Mercury Etoile',
      tone: 'def-white', basePrice: 95, unit: 'ct' },
    { id: 'hh', name: 'Mercury HH', tier: 'Extra Heavy',
      desc: '10% more thickness than Mercury H',
      tone: 'def-white', basePrice: 115, unit: 'ct' },
    { id: 'superheavy', name: 'Mercury Super Heavy', tier: 'Super Heavy',
      desc: '100% height · more than 30% weight increase',
      tone: 'def-white', basePrice: 165, unit: 'ct' },
    { id: 'hhh', name: 'Mercury HHH', tier: 'Triple Heavy',
      desc: 'Height more than 120%',
      tone: 'def-white', basePrice: 135, unit: 'ct' },
  ],
  corundum: [
    { id: 'aaa', name: 'EXCEL AAA', tier: 'Premium',
      desc: 'Premium quality — wide range of shapes and sizes available',
      tone: 'pigeon-blood', basePrice: 280, unit: 'ct' },
    { id: 'aa', name: 'DECCAN AA', tier: 'Commercial',
      desc: 'Best suited for mass-produced silver & brass jewellery — best quality for the price',
      tone: 'pigeon-blood', basePrice: 180, unit: 'ct' },
  ],
  labopal: [
    { id: 'a', name: 'Lab Created Opal', tier: 'Premium',
      desc: 'Bright play-of-colour, dense fire',
      tone: 'def-white', basePrice: 320, unit: 'pc' },
  ],
  opaque: [
    { id: 'natural', name: 'Natural look Opaque Stones', tier: 'Natural look',
      desc: 'Opaque stones that mimic natural gemstones',
      tone: 'tsavourite', basePrice: 140, unit: 'pc' },
    { id: 'opal', name: 'Opal look Opaque Stones', tier: 'Opal look',
      desc: 'Opaque stones with an opal-like play of colour',
      tone: 'tsavourite', basePrice: 160, unit: 'pc' },
  ],
  coral: [
    { id: 'a', name: 'Grade A', tier: 'Premium',
      desc: 'Even tone, smooth polish',
      tone: 'pigeon-blood', basePrice: 110, unit: 'pc' },
  ],
  polki: [
    { id: 'white',  name: 'White Polki',  tier: 'Unfoiled/Plain', origin: 'Regular & Uneven', desc: 'Uncut white polki',
      tone: 'def-white', basePrice: 60, unit: 'pc',
      subGrades: [
        { id: 'regular', name: 'Regular Shape', desc: 'Oval, pear, round & assorted shapes' },
        { id: 'b',   name: 'B Series',   desc: 'B-series · ordered by packet · priced per piece', directSize: true },
        { id: 'c',   name: 'C Series',   desc: 'C-series · ordered by packet · priced per piece', directSize: true },
        { id: 'x',   name: 'X Series',   desc: 'X-series · ordered by packet · priced per piece', directSize: true },
        { id: 'z',   name: 'Z Series',   desc: 'Z-series · ordered by packet · priced per piece', directSize: true },
        { id: 'pcj', name: 'PCJ Series', desc: 'PCJ-series · ordered by packet · priced per piece', directSize: true },
        { id: 'gj',  name: 'GJ Series',  desc: 'GJ-series · ordered by packet · priced per piece', directSize: true },
      ] },
    { id: 'kundan', name: 'Kundan Foil',  tier: 'Yellow Foiled', origin: 'Regular Shapes', desc: 'Kundan-foil-backed polki',
      tone: 'def-white', basePrice: 80, unit: 'pc' },
    { id: 'samosa', name: 'Moissanite Polki', tier: '925 Silver · Double Foiled', origin: 'Regular & Uneven', desc: 'Same layout & pricing as White Polki · double foiling, 92.5% silver purity · compulsory ₹25/pc foiling charge',
      tone: 'def-white', basePrice: 60, unit: 'pc', foilCharge: 25,
      subGrades: [
        { id: 'regular', name: 'Regular Shape', desc: 'Oval, pear, round & assorted shapes' },
        { id: 'b',   name: 'B Series',   desc: 'B-series · ordered by packet · priced per piece', directSize: true },
        { id: 'c',   name: 'C Series',   desc: 'C-series · ordered by packet · priced per piece', directSize: true },
        { id: 'x',   name: 'X Series',   desc: 'X-series · ordered by packet · priced per piece', directSize: true },
        { id: 'z',   name: 'Z Series',   desc: 'Z-series · ordered by packet · priced per piece', directSize: true },
        { id: 'pcj', name: 'PCJ Series', desc: 'PCJ-series · ordered by packet · priced per piece', directSize: true },
        { id: 'gj',  name: 'GJ Series',  desc: 'GJ-series · ordered by packet · priced per piece', directSize: true },
      ] },
  ],
  evileye: [
    { id: 'evileye', name: 'Real MOP Evil Eye', tier: 'Natural MOP', desc: 'Real mother of pearl with evil-eye motif',
      tone: 'def-white', basePrice: 40, unit: 'pc' },
  ],
  bracelet: [
    { id: 'rolex',   name: 'Rolex Style',   tier: 'Fashion', desc: 'Rolex-style bracelet',
      tone: 'def-white', basePrice: 850, unit: 'pc' },
    { id: 'cartier', name: 'Cartier Style', tier: 'Fashion', desc: 'Cartier-style bracelet',
      tone: 'def-white', basePrice: 950, unit: 'pc' },
  ],
  hollowmop: [
    { id: 'white', name: 'White MOP', tier: 'Natural', desc: 'Hollow white mother of pearl shapes',
      tone: 'def-white', basePrice: 36, unit: 'pc', fromText: 'from ₹36', fromUnit: 'pc' },
    { id: 'onyx',  name: 'Black Onyx', tier: 'Natural', desc: 'Hollow black onyx shapes',
      tone: 'def-white', basePrice: 36, unit: 'pc', fromText: 'from ₹36', fromUnit: 'pc' },
  ],
  labwhitecorundum: [
    { id: 'white', name: 'Lab White Corundum', tier: 'Lab Grown', desc: 'Calibrated lab-grown white corundum',
      tone: 'def-white', basePrice: 30, unit: 'pc' },
  ],
  alex: [
    { id: 'alex', name: 'Lab Alexandrite', tier: 'Lab Grown', desc: 'Colour-change lab-grown alexandrite',
      tone: 'royal-blue', basePrice: 70, unit: 'pc' },
  ],
  hotfix: [
    { id: 'aaa', name: 'AAA', tier: 'Premium',
      desc: 'Brilliant flat-back chatons, strong glue',
      tone: 'def-white', basePrice: 18, unit: 'pc' },
    { id: 'aa', name: 'AA', tier: 'Commercial',
      desc: 'Standard hotfix rhinestones',
      tone: 'def-white', basePrice: 11, unit: 'pc' },
  ],
  rajkot: [
    { id: 'white', name: 'White', tier: 'White', origin: 'Zirconia',
      desc: 'Mass-produced white zirconia — ordered & priced by the packet',
      tone: 'def-white', basePrice: 30, unit: 'pkt',
      subGrades: [
        { id: 'aaa',     name: 'AAA Silver Packet', desc: 'AAA silver packet · ordered & priced by the packet' },
        { id: 'shampoo', name: 'AA Shampoo Packet',  desc: 'AA shampoo packet · ordered & priced by the packet' },
      ] },
    { id: 'color', name: 'Colour', tier: 'Colour', origin: 'Zirconia',
      desc: 'Mass-produced colour zirconia — ordered & priced by the packet',
      tone: 'green', basePrice: 38, unit: 'pkt' },
  ],
};

// Shapes offered per category
const SHAPES_BY_CATEGORY = {
  moissanite: ['round','oval','pear','princess','cushion','emerald','marquise','heart','asscher','radiant','trillion','triangle','square-radiant','star','baguette','tapered'],
  rajkot:     ['round'],
  cz:         ['round','oval','pear','princess','cushion','marquise','emerald','baguette','tapered','heart','trillion'],
  whitecz:    ['round'],
  whitefancy: ['oval','pear','princess','cushion','emerald','marquise','heart','baguette','tapered'],
  labgrown:   ['oval','round','pear','cushion','emerald','heart','baguette','tapered'],
  fancycut:   ['trillion','pear','heart','marquise','baguette','tapered'],
  mop:        ['round','pearoval','square','heart','marquise','triangle','baguette','bellflower','bulgari','butterfly','natrivershell'],
  pearls:     ['fulldrilled','undrilled','halfdrilled','cabs'],
  navratna:   ['round','oval','pear','cushion','emerald','marquise','heart'],
  clover:     ['clover'],
  icecut:     ['oval','pear','oblong','radiant','square','round','cushion','marquise'],
  ourosa:     ['round'],
  beads:      ['plain-beads','faceted-beads','oval-maniya','drops'],
  laser:      ['round','marquise','oval','pear','square','invisible-square','heart','curved-trillion','cushion','oblong-cushion','asscher','radiant','baguette-prince','baguette-step','tapered-baguette','triangle','octagon','leaf'],
  alpanite:   ['round','oval','pear','princess','cushion','asscher','trillion','triangle','marquise','heart','baguette-step','octagon-step','octagon-princess'],
  multisapphire: ['round','oval','pear','cushion','emerald','heart','baguette','tapered'],
  cabochon:   ['round','oval','pear','marquise','pearoval','square'],
  highdensity:['round'],
  corundum:   ['round','oval','cushion','emerald','pear','baguette','tapered'],
  labopal:    ['round','oval','pear'],
  opaque:     ['round','oval','cushion'],
  coral:      ['round','oval'],
  polki:      ['round','oval','pear','cushion','marquise','heart'],
  evileye:    ['round','oval','pear','heart','marquise'],
  bracelet:   ['round'],
  hollowmop:  ['round','square','oval','baguette','pear','heart','clover','hexagon'],
  labwhitecorundum: ['round','oval','pear','princess','cushion','emerald','marquise','heart','baguette'],
  alex:       ['round','oval','pear','cushion','emerald','marquise','heart'],
};

// Navratna: Natural has many shapes; Created is round only.
const NAVRATNA_SHAPES_BY_GRADE = {
  // Natural navratna restricted to the shapes priced in the RIVEN sheet
  // (round, oval, pear, square→cushion, maq→marquise). Emerald/Heart have no price.
  natural: ['round','oval','pear','cushion','marquise'],
  created: ['round'],
};

// Pearls: drilling/format options depend on the chosen grade (Natural vs Created).
const PEARL_SHAPES_BY_GRADE = {
  natural: ['fulldrilled','undrilled','halfdrilled','cabs'],
  created: ['fulldrilled','halfdrilled','cabs'],
};

// Opaque: colours depend on the chosen grade (Natural look vs Opal look).
const OPAQUE_COLORS_BY_GRADE = {
  natural: [
    { id: 'red',   name: 'Red',   hex: '#C0432E', shapes: ['cutstones','maniya','tyre-plain','tyre-fac','ballhole-plain','ballhole-fac'] },
    { id: 'green', name: 'Green', hex: '#2E8C5C', shapes: ['cutstones','maniya','tyre-plain','tyre-fac','ballhole-plain','ballhole-fac'] },
  ],
  opal: [
    { id: 'op290', name: 'Color #290/4', hex: '#C98AA0', shapes: ['round','oval','pear','princess','marquise'], },
    { id: 'op210', name: 'Color #210/2', hex: '#7FB4C9', shapes: ['round','oval','pear','princess','marquise'], },
    { id: 'op283', name: 'Color #283',   hex: '#9C7DC2', shapes: ['round','oval','pear','princess','marquise'], },
    { id: 'op240', name: 'Color #240',   hex: '#E2B43A', shapes: ['round','oval','pear','princess','marquise'], },
    { id: 'op223', name: 'Color #223/2', hex: '#5BB89A', shapes: ['round','oval','pear','princess','marquise'], },
    { id: 'op216', name: 'Color #216',   hex: '#5B7BC4', shapes: ['round','oval','pear','princess','marquise'], },
    { id: 'op209', name: 'Color #209/3', hex: '#4F86B8', shapes: ['round','oval','pear','princess','marquise'], },
    { id: 'op288', name: 'Color #288/1', hex: '#D08A5B', shapes: ['round','oval','pear','princess','marquise'], },
  ],
};

// Pearls: colours depend on the chosen grade (Natural keeps the classic set;
// Created uses the four house shades with their codes).
const PEARL_COLORS_BY_GRADE = {
  natural: [
    { id: 'white', name: 'White',          hex: '#F2EFE8' },
  ],
  created: [
    { id: 'white',     name: 'White (650)',      hex: '#F2EFE8' },
    { id: 'lightgold', name: 'Light Gold (539)', hex: '#F0E6D2' },
    { id: 'cream',     name: 'Cream (620)',      hex: '#F5EEDC' },
    { id: 'gold',      name: 'Gold (296)',       hex: '#E2C879' },
  ],
};

// Corundum: EXCEL AAA carries Blue 34 + White in addition to the rubies;
// DECCAN AA is rubies only.
const CORUNDUM_COLORS_BY_GRADE = {
  aaa: [
    // EXCEL AAA carries only Ruby 5, Blue 34 and White.
    // Ruby 5 (VGI) prices loaded from a sheet — restrict to the shapes it prices.
    { id: 'ruby5',  name: 'Ruby 5',  hex: '#8B1E2E',
      shapes: ['round','oval','pear','marquise','princess','octagon-princess','heart'] },
    { id: 'blue34', name: 'Blue 34', hex: '#1E3A8A' },
    { id: 'white',  name: 'White',   hex: '#F2EFE8' },
  ],
  aa: [
    // Deccan Ruby 2 / Ruby 3 (same price) loaded from RIVEN sheet (per piece).
    { id: 'ruby2',  name: 'Ruby 2',  hex: '#B23A4A',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','trillion','triangle','asscher','star','octagon-step','octagon-princess','baguette','tapered'] },
    { id: 'ruby3',  name: 'Ruby 3',  hex: '#9E2A3A',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','trillion','triangle','asscher','star','octagon-step','octagon-princess','baguette','tapered'] },
    // Deccan Ruby 5 / Ruby 8 prices loaded from RIVEN sheets (per piece) —
    // restrict each to the shapes it actually prices.
    { id: 'ruby5',  name: 'Ruby 5',  hex: '#8B1E2E',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','trillion','triangle','asscher','star','octagon-step','octagon-princess','baguette'] },
    { id: 'ruby8',  name: 'Ruby 8',  hex: '#6E1422',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','trillion','triangle','asscher','star','octagon-step','octagon-princess','baguette'] },
  ],
};

// White Polki "uneven" series — each series is a set of named designs; every design
// has its own W×H footprint (mm). Ordered by packet, priced per piece. Prices and
// pcs-per-packet are catalog data (placeholder values until uploaded via bulk sheet).
const POLKI_SERIES_DESIGNS = {
  b: [
    { id: 'b-4-r', name: 'B-4 R', dims: [4,6.3], price: 4, pcsPerPacket: 28 },
    { id: 'b-4-l', name: 'B-4 L', dims: [4,6.3], price: 4, pcsPerPacket: 28 },
    { id: 'b-5-r', name: 'B-5 R', dims: [3.7,6.5], price: 3.6, pcsPerPacket: 28 },
    { id: 'b-5-l', name: 'B-5 L', dims: [3.7,6.5], price: 3.6, pcsPerPacket: 28 },
    { id: 'b-6-r', name: 'B-6 R', dims: [3.5,6.2], price: 3.6, pcsPerPacket: 28 },
    { id: 'b-6-l', name: 'B-6 L', dims: [3.5,6.2], price: 3.6, pcsPerPacket: 28 },
  ],
  c: [
    { id: 'c-2', name: 'C-2', dims: [5,7], price: 4.8, pcsPerPacket: 28 },
    { id: 'c-3-r', name: 'C-3 R', dims: [7,7], price: 6, pcsPerPacket: 30 },
    { id: 'c-3-l', name: 'C-3 L', dims: [7,7], price: 6, pcsPerPacket: 30 },
    { id: 'c-4', name: 'C-4', dims: [5.4,6.9], price: 5.2, pcsPerPacket: 28 },
    { id: 'c-5-r', name: 'C-5 R', dims: [5,6], price: 5, pcsPerPacket: 28 },
    { id: 'c-5-l', name: 'C-5 L', dims: [5,6], price: 5, pcsPerPacket: 28 },
    { id: 'c-7-r', name: 'C-7 R', dims: [5.6,6.4], price: 5.2, pcsPerPacket: 28 },
    { id: 'c-7-l', name: 'C-7 L', dims: [5.6,6.4], price: 5.2, pcsPerPacket: 28 },
    { id: 'c-8', name: 'C-8', dims: [6.3,7.4], price: 5.6, pcsPerPacket: 30 },
    { id: 'c-9-r', name: 'C-9 R', dims: [4,6.5], price: 4, pcsPerPacket: 28 },
    { id: 'c-9-l', name: 'C-9 L', dims: [4,6.5], price: 4, pcsPerPacket: 28 },
  ],
  x: [
    { id: 'x-1', name: 'X-1', dims: [3.2,4.2], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-2', name: 'X-2', dims: [3.5,3.8], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-3-l', name: 'X-3 L', dims: [3,3.8], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-4', name: 'X-4', dims: [3,3.4], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-5', name: 'X-5', dims: [3.6,4], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-6-r', name: 'X-6 R', dims: [3,4], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-6-l', name: 'X-6 L', dims: [3,4], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-7', name: 'X-7', dims: [2,3.6,3.7], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-8', name: 'X-8', dims: [3,3.2], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-9', name: 'X-9', dims: [3.2,3.6], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-10', name: 'X-10', dims: [2.8,4.2], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-12', name: 'X-12', dims: [2.8,3.8], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-13', name: 'X-13', dims: [3.7,3.8], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-15', name: 'X-15', dims: [3.3,4.3], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-16', name: 'X-16', dims: [3.9,3.9], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-17-r', name: 'X-17 R', dims: [3.3,3.7], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-17-l', name: 'X-17 L', dims: [3.3,3.7], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-18', name: 'X-18', dims: [3.6,4.2], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-19', name: 'X-19', dims: [3.6,3.8], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-20', name: 'X-20', dims: [3,3.5], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-21-r', name: 'X-21 R', dims: [3.3,4.3], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-21-l', name: 'X-21 L', dims: [3.3,4.3], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-22-r', name: 'X-22 R', dims: [3.6,3.9], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-22-l', name: 'X-22 L', dims: [3.6,3.9], price: 2.4, pcsPerPacket: 25 },
    { id: 'x-23', name: 'X-23', dims: [3.8,3.8], price: 2.4, pcsPerPacket: 25 },
  ],
  z: [
    { id: 'z-5-r', name: 'Z-5 R', dims: [7.3,8.1], price: 7.2, pcsPerPacket: 35 },
    { id: 'z-5-l', name: 'Z-5 L', dims: [7.3,8.1], price: 7.2, pcsPerPacket: 35 },
    { id: 'z-6-r', name: 'Z-6 R', dims: [7.2,9.3], price: 9.6, pcsPerPacket: 40 },
    { id: 'z-7-r', name: 'Z-7 R', dims: [6.2,7.2], price: 6, pcsPerPacket: 35 },
    { id: 'z-9', name: 'Z-9', dims: [5.4,8.4], price: 6.4, pcsPerPacket: 35 },
    { id: 'z-10', name: 'Z-10', dims: [7.3,7.7], price: 7.2, pcsPerPacket: 35 },
    { id: 'z-14', name: 'Z-14', dims: [6.5,8], price: 7.4, pcsPerPacket: 35 },
    { id: 'z-15-r', name: 'Z-15 R', dims: [4.9,9.9], price: 6.8, pcsPerPacket: 35 },
    { id: 'z-15', name: 'Z-15', dims: [4.9,9.9], price: 6.8, pcsPerPacket: 35 },
    { id: 'z-17-r', name: 'Z-17 R', dims: [7.4,8], price: 7.2, pcsPerPacket: 35 },
    { id: 'z-17-l', name: 'Z-17 L', dims: [7.4,8], price: 7.2, pcsPerPacket: 35 },
    { id: 'z-19-r', name: 'Z-19 R', dims: [6,7], price: 6, pcsPerPacket: 35 },
    { id: 'z-20-r', name: 'Z-20 R', dims: [6.8,8.5], price: 7.6, pcsPerPacket: 35 },
    { id: 'z-20-l', name: 'Z-20 L', dims: [6.8,8.5], price: 7.6, pcsPerPacket: 35 },
    { id: 'z-21', name: 'Z-21', dims: [4.7,8.6], price: 6.4, pcsPerPacket: 35 },
    { id: 'z-22', name: 'Z-22', dims: [7.1,8.1], price: 7.2, pcsPerPacket: 35 },
    { id: 'z-25', name: 'Z-25', dims: [5.5,10.5], price: 7.2, pcsPerPacket: 35 },
    { id: 'z-26', name: 'Z-26', dims: [6.3,8.3], price: 7, pcsPerPacket: 35 },
    { id: 'z-27-r', name: 'Z-27 R', dims: [6.7,10.7], price: 10, pcsPerPacket: 40 },
    { id: 'z-27-l', name: 'Z-27 L', dims: [6.7,10.7], price: 10, pcsPerPacket: 40 },
    { id: 'z-1-r', name: 'Z-1 R', dims: [9,10], price: 12, pcsPerPacket: 40 },
    { id: 'z-2-l', name: 'Z-2 L', dims: [9,10], price: 12, pcsPerPacket: 40 },
    { id: 'z-3-r', name: 'Z-3 R', dims: [5.9,9.2], price: 6.8, pcsPerPacket: 35 },
    { id: 'z-3-l', name: 'Z-3 L', dims: [5.9,9.2], price: 6.8, pcsPerPacket: 35 },
    { id: 'z-4', name: 'Z-4', dims: [7.7,10.7], price: 7.2, pcsPerPacket: 35 },
  ],
  pcj: [
    { id: 'pcj-3', name: 'PCJ-3', dims: [4.5,6.8], price: 3.6, pcsPerPacket: 30 },
    { id: 'pcj-4', name: 'PCJ-4', dims: [6,8.5], price: 5.2, pcsPerPacket: 35 },
    { id: 'pcj-5', name: 'PCJ-5', dims: [6.5,9], price: 5.6, pcsPerPacket: 35 },
    { id: 'pcj-6', name: 'PCJ-6', dims: [8,11], price: 8.4, pcsPerPacket: 40 },
    { id: 'pcj-7', name: 'PCJ-7', dims: [9,13], price: 15, pcsPerPacket: 45 },
    { id: 'pcj-8', name: 'PCJ-8', dims: [8,12], price: 12, pcsPerPacket: 40 },
  ],
  gj: [
    { id: 'gj-1', name: 'GJ-1', dims: [2.5,4.4], price: 2.4, pcsPerPacket: 25 },
    { id: 'gj-41', name: 'GJ-41', dims: [5,8], price: 5, pcsPerPacket: 30 },
    { id: 'gj-75-r', name: 'GJ-75 R', dims: [9.7,10.3], price: 15.6, pcsPerPacket: 45 },
    { id: 'gj-2-r', name: 'GJ-2 R', dims: [2.9,5], price: 3, pcsPerPacket: 25 },
    { id: 'gj-42', name: 'GJ-42', dims: [5,7.5], price: 4.4, pcsPerPacket: 30 },
    { id: 'gj-75-l', name: 'GJ-75 L', dims: [9.7,10.3], price: 15.6, pcsPerPacket: 45 },
    { id: 'gj-2-l', name: 'GJ-2 L', dims: [2.9,5], price: 3, pcsPerPacket: 25 },
    { id: 'gj-43', name: 'GJ-43', dims: [5,5.5], price: 4, pcsPerPacket: 30 },
    { id: 'gj-76-r', name: 'GJ-76 R', dims: [9.7,10], price: 15.6, pcsPerPacket: 45 },
    { id: 'gj-3-r', name: 'GJ-3 R', dims: [2.9,5.8], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-44', name: 'GJ-44', dims: [5,7], price: 4, pcsPerPacket: 30 },
    { id: 'gj-76-l', name: 'GJ-76 L', dims: [9.7,10], price: 15.6, pcsPerPacket: 45 },
    { id: 'gj-3-l', name: 'GJ-3 L', dims: [2.9,5.8], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-45', name: 'GJ-45', dims: [5,6], price: 4.4, pcsPerPacket: 30 },
    { id: 'gj-77-r', name: 'GJ-77 R', dims: [9.5,11], price: 16, pcsPerPacket: 50 },
    { id: 'gj-4', name: 'GJ-4', dims: [2,3,3.5], price: 1.9, pcsPerPacket: 25 },
    { id: 'gj-46-r', name: 'GJ-46 R', dims: [5,7], price: 4.4, pcsPerPacket: 30 },
    { id: 'gj-77-l', name: 'GJ-77 L', dims: [9.5,11], price: 16, pcsPerPacket: 50 },
    { id: 'gj-5', name: 'GJ-5', dims: [2.5,4,4], price: 2.2, pcsPerPacket: 25 },
    { id: 'gj-47', name: 'GJ-47', dims: [5,7], price: 6, pcsPerPacket: 30 },
    { id: 'gj-78-r', name: 'GJ-78 R', dims: [4.7,5.3], price: 5.6, pcsPerPacket: 30 },
    { id: 'gj-6', name: 'GJ-6', dims: [2.6,5.2], price: 3, pcsPerPacket: 25 },
    { id: 'gj-48', name: 'GJ-48', dims: [5,5], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-78-l', name: 'GJ-78 L', dims: [4.7,5.3], price: 5.6, pcsPerPacket: 30 },
    { id: 'gj-7', name: 'GJ-7', dims: [2,3,3], price: 1.9, pcsPerPacket: 25 },
    { id: 'gj-49-r', name: 'GJ-49 R', dims: [5.4,6.7], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-8-r', name: 'GJ-8 R', dims: [2.5,3.2], price: 2.2, pcsPerPacket: 25 },
    { id: 'gj-49-l', name: 'GJ-49 L', dims: [5.4,6.7], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-8-l', name: 'GJ-8 L', dims: [2.5,3.2], price: 2.2, pcsPerPacket: 25 },
    { id: 'gj-50-r', name: 'GJ-50 R', dims: [5.5,6.5], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-9', name: 'GJ-9', dims: [2,4.5,5], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-50-l', name: 'GJ-50 L', dims: [5.5,6.5], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-10', name: 'GJ-10', dims: [2.5,3], price: 2.2, pcsPerPacket: 25 },
    { id: 'gj-51-r', name: 'GJ-51 R', dims: [5.4,6.6], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-11', name: 'GJ-11', dims: [3,4,5], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-51-l', name: 'GJ-51 L', dims: [5.4,6.6], price: 6, pcsPerPacket: 30 },
    { id: 'gj-12', name: 'GJ-12', dims: [3.5,4.4], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-52-r', name: 'GJ-52 R', dims: [5.4,7.5], price: 6, pcsPerPacket: 30 },
    { id: 'gj-13', name: 'GJ-13', dims: [3.5,4.5], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-52-l', name: 'GJ-52 L', dims: [5.4,7.5], price: 6, pcsPerPacket: 30 },
    { id: 'gj-14', name: 'GJ-14', dims: [3.5,3.5], price: 2.6, pcsPerPacket: 25 },
    { id: 'gj-53-r', name: 'GJ-53 R', dims: [5.3,5.7], price: 6, pcsPerPacket: 30 },
    { id: 'gj-15', name: 'GJ-15', dims: [3.6,5], price: 4.6, pcsPerPacket: 28 },
    { id: 'gj-53-l', name: 'GJ-53 L', dims: [5.3,5.7], price: 6, pcsPerPacket: 30 },
    { id: 'gj-16-r', name: 'GJ-16 R', dims: [3,6.7], price: 3, pcsPerPacket: 25 },
    { id: 'gj-54-r', name: 'GJ-54 R', dims: [5,9], price: 6.6, pcsPerPacket: 35 },
    { id: 'gj-16-l', name: 'GJ-16 L', dims: [3,6.7], price: 3, pcsPerPacket: 25 },
    { id: 'gj-54-l', name: 'GJ-54 L', dims: [5,9], price: 6.6, pcsPerPacket: 35 },
    { id: 'gj-17', name: 'GJ-17', dims: [3.6,5.7], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-55-r', name: 'GJ-55 R', dims: [5,7.3], price: 6.6, pcsPerPacket: 30 },
    { id: 'gj-18', name: 'GJ-18', dims: [3.5,6], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-55-l', name: 'GJ-55 L', dims: [5,7.3], price: 6.6, pcsPerPacket: 30 },
    { id: 'gj-19', name: 'GJ-19', dims: [3.5,4], price: 2, pcsPerPacket: 25 },
    { id: 'gj-56-r', name: 'GJ-56 R', dims: [5.8,7], price: 7, pcsPerPacket: 35 },
    { id: 'gj-20', name: 'GJ-20', dims: [4,4], price: 2.2, pcsPerPacket: 25 },
    { id: 'gj-56-l', name: 'GJ-56 L', dims: [5.8,7], price: 7, pcsPerPacket: 35 },
    { id: 'gj-21', name: 'GJ-21', dims: [4,6.4], price: 4, pcsPerPacket: 28 },
    { id: 'gj-57-r', name: 'GJ-57 R', dims: [5.7,6.5], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-22', name: 'GJ-22', dims: [4,4.3], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-57-l', name: 'GJ-57 L', dims: [5.7,6.5], price: 4.8, pcsPerPacket: 30 },
    { id: 'gj-23', name: 'GJ-23', dims: [4,5.2], price: 3.6, pcsPerPacket: 28 },
    { id: 'gj-58', name: 'GJ-58', dims: [6,7], price: 6, pcsPerPacket: 30 },
    { id: 'gj-24', name: 'GJ-24', dims: [4,5], price: 4.4, pcsPerPacket: 28 },
    { id: 'gj-59', name: 'GJ-59', dims: [6,7.3], price: 6.4, pcsPerPacket: 30 },
    { id: 'gj-25', name: 'GJ-25', dims: [4,4.6], price: 3.2, pcsPerPacket: 28 },
    { id: 'gj-60', name: 'GJ-60', dims: [6.5,7.5], price: 6, pcsPerPacket: 30 },
    { id: 'gj-26', name: 'GJ-26', dims: [4,6.5], price: 3.6, pcsPerPacket: 28 },
    { id: 'gj-61', name: 'GJ-61', dims: [6,8.5], price: 5.2, pcsPerPacket: 35 },
    { id: 'gj-27', name: 'GJ-27', dims: [5,6], price: 4.4, pcsPerPacket: 28 },
    { id: 'gj-62-l', name: 'GJ-62 L', dims: [6.5,11], price: 11.6, pcsPerPacket: 40 },
    { id: 'gj-28', name: 'GJ-28', dims: [4,4], price: 5, pcsPerPacket: 28 },
    { id: 'gj-63', name: 'GJ-63', dims: [6,8.5], price: 6, pcsPerPacket: 35 },
    { id: 'gj-29', name: 'GJ-29', dims: [4.5,8.5], price: 6, pcsPerPacket: 30 },
    { id: 'gj-64-l', name: 'GJ-64 L', dims: [6,7], price: 6, pcsPerPacket: 30 },
    { id: 'gj-30-l', name: 'GJ-30 L', dims: [4.5,5.4], price: 4, pcsPerPacket: 28 },
    { id: 'gj-65', name: 'GJ-65', dims: [6,6], price: 5.6, pcsPerPacket: 30 },
    { id: 'gj-31-r', name: 'GJ-31 R', dims: [4.4,4.7], price: 4, pcsPerPacket: 28 },
    { id: 'gj-66', name: 'GJ-66', dims: [6,6], price: 5.6, pcsPerPacket: 30 },
    { id: 'gj-31-l', name: 'GJ-31 L', dims: [4.4,4.7], price: 4, pcsPerPacket: 28 },
    { id: 'gj-67-r', name: 'GJ-67 R', dims: [6.3,6.6], price: 5.2, pcsPerPacket: 30 },
    { id: 'gj-32-r', name: 'GJ-32 R', dims: [4,6], price: 4, pcsPerPacket: 28 },
    { id: 'gj-67-l', name: 'GJ-67 L', dims: [6.3,6.6], price: 5.2, pcsPerPacket: 30 },
    { id: 'gj-32-l', name: 'GJ-32 L', dims: [4,6], price: 4, pcsPerPacket: 28 },
    { id: 'gj-68-r', name: 'GJ-68 R', dims: [6.5,10], price: 11, pcsPerPacket: 40 },
    { id: 'gj-33-r', name: 'GJ-33 R', dims: [4,8], price: 3.6, pcsPerPacket: 28 },
    { id: 'gj-68-l', name: 'GJ-68 L', dims: [6.5,10], price: 11, pcsPerPacket: 40 },
    { id: 'gj-33-l', name: 'GJ-33 L', dims: [4,8], price: 3.6, pcsPerPacket: 28 },
    { id: 'gj-69-l', name: 'GJ-69 L', dims: [7,8], price: 7.6, pcsPerPacket: 35 },
    { id: 'gj-34-r', name: 'GJ-34 R', dims: [4.5,7.3], price: 6, pcsPerPacket: 30 },
    { id: 'gj-70-r', name: 'GJ-70 R', dims: [8,11.5], price: 15, pcsPerPacket: 45 },
    { id: 'gj-34-l', name: 'GJ-34 L', dims: [4.5,7.3], price: 6, pcsPerPacket: 30 },
    { id: 'gj-70-l', name: 'GJ-70 L', dims: [8,11.5], price: 15.6, pcsPerPacket: 45 },
    { id: 'gj-35-r', name: 'GJ-35 R', dims: [4,7], price: 6, pcsPerPacket: 30 },
    { id: 'gj-71', name: 'GJ-71', dims: [9,14.5], price: 24, pcsPerPacket: 60 },
    { id: 'gj-35-l', name: 'GJ-35 L', dims: [4,7], price: 6, pcsPerPacket: 30 },
    { id: 'gj-72-r', name: 'GJ-72 R', dims: [9,11], price: 19, pcsPerPacket: 50 },
    { id: 'gj-36', name: 'GJ-36', dims: [5,5], price: 3.2, pcsPerPacket: 30 },
    { id: 'gj-72-l', name: 'GJ-72 L', dims: [9,11], price: 19, pcsPerPacket: 50 },
    { id: 'gj-37', name: 'GJ-37', dims: [5,4,3], price: 3, pcsPerPacket: 25 },
    { id: 'gj-73-r', name: 'GJ-73 R', dims: [9.3,11], price: 19, pcsPerPacket: 50 },
    { id: 'gj-38', name: 'GJ-38', dims: [5.2,7.6], price: 4.6, pcsPerPacket: 28 },
    { id: 'gj-73-l', name: 'GJ-73 L', dims: [9.3,11], price: 19, pcsPerPacket: 50 },
    { id: 'gj-39', name: 'GJ-39', dims: [5,5], price: 4, pcsPerPacket: 28 },
    { id: 'gj-74-r', name: 'GJ-74 R', dims: [10,11], price: 24, pcsPerPacket: 60 },
    { id: 'gj-40', name: 'GJ-40', dims: [5.4,7], price: 4.2, pcsPerPacket: 28 },
    { id: 'gj-74-l', name: 'GJ-74 L', dims: [10,11], price: 24, pcsPerPacket: 60 },
  ],
};

// Rajkot Mass Produced Zirconia: White grade is white-only; Colour grade carries the colour range.
const RAJKOT_COLORS_BY_GRADE = {
  white: [
    { id: 'white', name: 'White', hex: '#F2EFE8' },
  ],
  color: [
    { id: 'pinkcz',      name: 'Pink CZ',       hex: '#E6A4B4' },
    { id: 'nanogreen',   name: 'Nano Green',    hex: '#3E8E4F' },
    { id: 'nanoblue113', name: 'Nano Blue 113', hex: '#2E6FB0' },
    { id: 'nanoblue114', name: 'Nano Blue 114', hex: '#1F5A95' },
    { id: 'ruby5aaa',    name: 'Ruby 5 AAA',    hex: '#B0234A' },
    { id: 'ruby5aa',     name: 'Ruby 5 AA',     hex: '#C44A66' },
  ],
};

// Colour CZ: Excel-E carries the full colour range; Deccan a reduced set.
const CZ_COLORS_BY_GRADE = {
  excele: [
    // Green / Aqua / Brown / Tanzanite / Rhodolite prices loaded from RIVEN sheets —
    // restrict each to the shapes it actually prices.
    { id: 'green',     name: 'Green CZ',   hex: '#3E8E4F',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','asscher','octagon-princess','baguette','hexagon'] },
    { id: 'aqua',      name: 'Aqua CZ',    hex: '#5B7BC4',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','trillion','triangle','asscher','octagon-step','octagon-princess','oblong-cushion','baguette','hexagon','star'],
      subShades: [
      { id: 'aqua37', name: '#37', hex: '#6FA8C9' },
      { id: 'aqua38', name: '#38', hex: '#4F86B8' },
      { id: 'aqua39', name: '#39', hex: '#356FA6' },
    ] },
    { id: 'purple',    name: 'Amethyst',   hex: '#9C7DC2',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'inkblue',   name: 'Ink Blue',   hex: '#1E2A6A',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'pink',      name: 'Pink',       hex: '#E6A4B4',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'yellow',    name: 'Yellow',     hex: '#E2B43A',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'brown',     name: 'Brown',      hex: '#7A4A2E',
      shapes: ['round','oval','pear','marquise','cushion','asscher','octagon-princess','baguette'] },
    { id: 'garnet',    name: 'Garnet',     hex: '#8B1E2E',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'olive',     name: 'Olive',      hex: '#6B7A3A',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'tanzanite', name: 'Tanzanite',  hex: '#5B5BC4',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','trillion','triangle','octagon-step','octagon-princess','oblong-cushion','baguette'] },
    { id: 'tcf',       name: 'TCF Colours', hex: '#2E9C8E',
      shapes: ['round','oval','pear','marquise','baguette','octagon-step','princess','heart','triangle','trillion','star'],
      subShades: [
      { id: 'tcfmint',  name: 'Mint Green TCF',  hex: '#7EC8A8' },
      { id: 'tcfgreen', name: 'Green TCF',       hex: '#2E8C5C' },
      { id: 'tcfarctic',name: 'Arctic Blue TCF', hex: '#6FB8D6' },
      { id: 'tcfred',   name: 'Red TCF',         hex: '#C0392B' },
    ] },
    { id: 'black',     name: 'Black CZ',     hex: '#2A2A28',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'champagne', name: 'Champagne CZ', hex: '#D8C9A8',
      shapes: ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'] },
    { id: 'rhodolite', name: 'Rhodolite',    hex: '#9C3A66',
      shapes: ['round','oval','pear','marquise','octagon-princess','baguette'] },
  ],
  deccan: [
    { id: 'purple',    name: 'Amethyst',   hex: '#9C7DC2',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
    { id: 'inkblue',   name: 'Ink Blue',   hex: '#1E2A6A',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
    { id: 'pink',      name: 'Pink',       hex: '#E6A4B4',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
    { id: 'yellow',    name: 'Yellow',     hex: '#E2B43A',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
    { id: 'garnet',    name: 'Garnet',     hex: '#8B1E2E',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
    { id: 'olive',     name: 'Olive',      hex: '#6B7A3A',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
    { id: 'black',     name: 'Black CZ',     hex: '#2A2A28',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
    { id: 'champagne', name: 'Champagne CZ', hex: '#D8C9A8',
      shapes: ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'] },
  ],
};

// Lab Grown: the certified "Lab Grown Gemstones" grade carries the full colour
// range; "Created Coloured Gemstones" has its own four coded stones.
const LABGROWN_COLORS_BY_GRADE = {
  created: [
    { id: 'z8483', name: 'Z-8483 Pink Tourmaline', hex: '#E0567E', sizeMin: 4.00 },
    { id: 'z22',   name: 'Z-22 Zambia Emerald',    hex: '#0E5C4A', sizeMin: 4.00 },
    { id: 'z5912', name: 'Z-5912 Columbia Emerald', hex: '#1E7A52', sizeMin: 4.00 },
    { id: 'z597',  name: 'Z-597 Tanzanite',        hex: '#5B5BC4', sizeMin: 4.00 },
  ],
  labcorundum: [
    { id: 'peach',       name: 'Peach',          hex: '#F2B89C' },
    { id: 'padp55',      name: 'Padparadscha 55', hex: '#F08E6A' },
    { id: 'purple65',    name: 'Purple 65',      hex: '#8E5FB0' },
    { id: 'alex45',      name: 'Alex 45',        hex: '#4E7E6E' },
    { id: 'alex46',      name: 'Alex 46',        hex: '#6E7EA0' },
    { id: 'violet60',    name: 'Violet 60',      hex: '#7A4FB0' },
    { id: 'kunzite61',   name: 'Kunzite 61',     hex: '#E5A8C8' },
    { id: 'spinel105',   name: 'Spinel 105',     hex: '#C0324E' },
    { id: 'spinel106',   name: 'Spinel 106',     hex: '#B0445E' },
    { id: 'spinel108',   name: 'Spinel 108',     hex: '#9C2C44' },
    { id: 'white',       name: 'White',          hex: '#F2EFE8' },
    { id: 'green',       name: 'Green',          hex: '#2E8C5C' },
    { id: 'sunrise',     name: 'Sunrise',        hex: '#F2925A' },
    { id: 'yellow',      name: 'Yellow',         hex: '#E2B43A' },
    { id: 'yellow20',    name: 'Yellow 20',      hex: '#EAC24E' },
  ],
};

// Colours offered per category (different per category). Each carries an
// explicit hex so we never depend on a missing tone, plus an optional price
// multiplier (fancy colours can cost more than white).
const COLORS_BY_CATEGORY = {
  whitecz: [
    { id: 'white', name: 'White', hex: '#F2EFE8' },
  ],
  rajkot: [
    { id: 'pinkcz',      name: 'Pink CZ',       hex: '#E6A4B4' },
    { id: 'nanogreen',   name: 'Nano Green',    hex: '#3E8E4F' },
    { id: 'nanoblue113', name: 'Nano Blue 113', hex: '#2E6FB0' },
    { id: 'nanoblue114', name: 'Nano Blue 114', hex: '#1F5A95' },
    { id: 'ruby5aaa',    name: 'Ruby 5 AAA',    hex: '#B0234A' },
    { id: 'ruby5aa',     name: 'Ruby 5 AA',     hex: '#C44A66' },
  ],
  whitefancy: [
    { id: 'white', name: 'White', hex: '#F2EFE8' },
  ],
  moissanite: [
    { id: 'white',  name: 'White',        hex: '#F2EFE8' },
  ],
  cz: [
    { id: 'white',     name: 'White',      hex: '#F2EFE8' },
    { id: 'green',     name: 'Green',      hex: '#3E8E4F' },
    { id: 'pink',      name: 'Pink',       hex: '#E6A4B4' },
    { id: 'aqua',      name: 'Aqua Blue',  hex: '#5B7BC4', subShades: [
      { id: 'aqua37', name: '#37', hex: '#6FA8C9' },
      { id: 'aqua38', name: '#38', hex: '#4F86B8' },
      { id: 'aqua39', name: '#39', hex: '#356FA6' },
    ] },
    { id: 'royal',     name: 'Royal Blue', hex: '#1E3A8A' },
    { id: 'red',       name: 'Garnet Red', hex: '#8B1E2E' },
    { id: 'yellow',    name: 'Canary',     hex: '#E2B43A' },
    { id: 'purple',    name: 'Amethyst',   hex: '#9C7DC2' },
    { id: 'champagne', name: 'Champagne',  hex: '#D8C9A8' },
    { id: 'black',     name: 'Black',      hex: '#2A2A28' },
  ],
  labgrown: [
    { id: 'pigeon',   name: 'Pigeon Blood',   hex: '#8B1E2E' },
    { id: 'fairypink',name: 'Fairy Pink',     hex: '#E6A4B4' },
    { id: 'zambia',   name: 'Zambia Emerald', hex: '#0E5C4A' },
    { id: 'royalblue',name: 'Royal Blue',     hex: '#1E3A8A' },
    { id: 'sakura',   name: 'Sakura Pink',    hex: '#F0B9C8', sizeMin: 6.00 },
    { id: 'padparadscha', name: 'Padparadscha', hex: '#E8895B', sizeMin: 6.00 },
    { id: 'hotpink',  name: 'Hot Pink',       hex: '#D6336C', sizeMin: 6.00 },
    { id: 'royalred', name: 'Royal Red',      hex: '#A01828', sizeMin: 6.00 },
    { id: 'lavender', name: 'Lavender',       hex: '#9C7DC2', sizeMin: 6.00 },
    { id: 'alexander',name: 'Alexander',      hex: '#6E7BB8', sizeMin: 6.00 },
    { id: 'bluedemon',name: 'Blue Demon',     hex: '#2342A8', sizeMin: 6.00 },
    { id: 'cornflower',name: 'Cornflower',    hex: '#5B7BC4', sizeMin: 6.00 },
    { id: 'pariba',   name: 'Pariba',         hex: '#1FA9A0', sizeMin: 6.00 },
    { id: 'columbia', name: 'Columbia',       hex: '#1E7A52', sizeMin: 6.00 },
    { id: 'sunny',    name: 'Sunny Orange',   hex: '#E8842E', sizeMin: 6.00 },
    { id: 'canary',   name: 'Canary Yellow',  hex: '#E2C233', sizeMin: 6.00 },
  ],
  fancycut: [
    { id: 'white',     name: 'White',     hex: '#F2EFE8' },
    { id: 'champagne', name: 'Champagne', hex: '#D8C9A8' },
    { id: 'grey',      name: 'Salt & Pepper', hex: '#8A8A82' },
  ],
  mop: [
    { id: 'mop', name: 'Mother of Pearl', hex: '#EFE9DD' },
  ],
  pearls: [
    { id: 'white', name: 'White',         hex: '#F2EFE8' },
    { id: 'cream', name: 'Light Gold',         hex: '#F0E6D2' },
    { id: 'pink',  name: 'Pink',          hex: '#E6A4B4' },
    { id: 'black', name: 'Tahitian Black', hex: '#3A3A42' },
  ],
  navratna: [
    { id: 'mixed', name: 'Mixed (9 stones)', hex: '#8B1E2E' },
  ],
  icecut: [
    { id: 'white', name: 'White', hex: '#F2EFE8' },
    { id: 'champagne', name: 'Champagne', hex: '#D8C9A8' },
    { id: 'grey', name: 'Grey', hex: '#8A8A82' },
  ],
  icecut: [
    { id: 'white', name: 'White', hex: '#F2EFE8', codes: 'G40',
      subShades: [{ id: 'g40', name: 'G40', hex: '#F2EFE8' }] },
    { id: 'normal', name: 'Normal', hex: '#E2B43A', codes: 'G01·G02·G07·G08·G12–G15·G41·G44·G56·G66',
      subShades: [
        {id:'g01',name:'G01',hex:'#E2B43A'},{id:'g02',name:'G02',hex:'#D4A830'},
        {id:'g07',name:'G07',hex:'#62A8D0'},{id:'g08',name:'G08',hex:'#9090C8'},
        {id:'g12',name:'G12',hex:'#D0C840'},{id:'g13',name:'G13',hex:'#50A878'},
        {id:'g14',name:'G14',hex:'#D07880'},{id:'g15',name:'G15',hex:'#4888C8'},
        {id:'g41',name:'G41',hex:'#90C090'},{id:'g44',name:'G44',hex:'#C84878'},
        {id:'g56',name:'G56',hex:'#8898D0'},{id:'g66',name:'G66',hex:'#E0A8C0'},
      ] },
    { id: 'special1', name: 'Special 1', hex: '#C0432E', codes: 'G03·G04·G05·G16·G45·G46·G52·G55·G58·G59·G62',
      subShades: [
        {id:'g03',name:'G03',hex:'#C0432E'},{id:'g04',name:'G04',hex:'#D05838'},
        {id:'g05',name:'G05',hex:'#B83060'},{id:'g16',name:'G16',hex:'#C85828'},
        {id:'g45',name:'G45',hex:'#D87848'},{id:'g46',name:'G46',hex:'#C04060'},
        {id:'g52',name:'G52',hex:'#A83050'},{id:'g55',name:'G55',hex:'#D06840'},
        {id:'g58',name:'G58',hex:'#B84838'},{id:'g59',name:'G59',hex:'#C06070'},
        {id:'g62',name:'G62',hex:'#B05090'},
      ] },
    { id: 'special2', name: 'Special 2', hex: '#2A6FDB', codes: 'G17–G21·G30–G39',
      subShades: [
        {id:'g17',name:'G17',hex:'#2A6FDB'},{id:'g18',name:'G18',hex:'#3878D0'},
        {id:'g19',name:'G19',hex:'#2060C8'},{id:'g20',name:'G20',hex:'#4878C0'},
        {id:'g21',name:'G21',hex:'#3068D8'},{id:'g30',name:'G30',hex:'#2858C0'},
        {id:'g31',name:'G31',hex:'#3870CC'},{id:'g32',name:'G32',hex:'#4880D0'},
        {id:'g33',name:'G33',hex:'#2068C8'},{id:'g34',name:'G34',hex:'#3060B8'},
        {id:'g35',name:'G35',hex:'#2870D8'},{id:'g36',name:'G36',hex:'#4070C8'},
        {id:'g37',name:'G37',hex:'#3868C0'},{id:'g38',name:'G38',hex:'#2860D0'},
        {id:'g39',name:'G39',hex:'#3878C8'},
      ] },
    { id: 'paribas', name: 'Paraiba', hex: '#1FA89A', codes: 'G27·G28·G29·G76–G80 · Pariba T3/T4',
      subShades: [
        {id:'g27',name:'G27',hex:'#1FA89A'},{id:'g28',name:'G28',hex:'#22B0A0'},
        {id:'g29',name:'G29',hex:'#18A090'},{id:'g76',name:'G76',hex:'#20B8A8'},
        {id:'g77',name:'G77',hex:'#18A898'},{id:'g78',name:'G78',hex:'#22B0A8'},
        {id:'g79',name:'G79',hex:'#1AA898'},{id:'g80',name:'G80',hex:'#20A8A0'},
        {id:'t3', name:'T3', hex:'#1890A0'},{id:'t4', name:'T4', hex:'#1898A8'},
      ] },
  ],
  ourosa: [
    { id: 'white',  name: 'White Shadow',  hex: '#F2EFE8' },
    { id: 'golden', name: 'Golden Shadow', hex: '#D8B45A' },
  ],
  clover: [
    { id: 'natmop',    name: 'Natural MOP White', hex: '#F2EFE8' },
    { id: 'greenagate',name: 'Green Agate',       hex: '#2E8C5C' },
    { id: 'redagate',  name: 'Red Agate',         hex: '#9E3B2E' },
    { id: 'onyx',      name: 'Black Onyx',        hex: '#2A2A28' },
    { id: 'tigereye',  name: 'Tiger Eye',         hex: '#9A6B2F' },
    { id: 'pinkmop',   name: 'Pink MOP',          hex: '#E6A4B4' },
    { id: 'cherry',    name: 'Cherry Red',        hex: '#B0202E' },
  ],
  beads: [
    { id: 'default', name: 'Beads', hex: '#C0432E' },
  ],
  laser: [
    { id: 'white',          name: 'White',              hex: '#F2EFE8' },
    { id: 'vgi-ruby-med',   name: 'VGI Ruby Medium',    hex: '#C0432E', whiteDisc: true },
    { id: 'vgi-red-dark',   name: 'VGI Red Dark',       hex: '#8B1E2E', whiteDisc: true },
    { id: 'vgi-alp-green',  name: 'VGI Alp Green',      hex: '#3E8E4F', whiteDisc: true },
    { id: 'vgi-alp-blue',   name: 'VGI Alp Blue',       hex: '#1E3A8A', whiteDisc: true },
    { id: 'vgi-pink-saph',  name: 'VGI Pink Sapphire',  hex: '#D97090', whiteDisc: true },
  ],
  alpanite: [
    { id: 'green',  name: 'Euro Alp Green', hex: '#3E8E4F' },
    { id: 'blue',   name: 'Alp Blue',       hex: '#1E3A8A',
      shapes: ['round','oval','pear','marquise','princess','cushion','asscher','triangle','trillion','heart','star','octagon-step','octagon-princess','baguette-step','tapered'] },
    { id: 'yellow',   name: 'Alp Yellow',       hex: '#E2B43A', shapes: ['round'] },
    { id: 'alp162',   name: 'Alp 162/2',        hex: '#C8A24C', shapes: ['round'] },
    { id: 'alp-aqua', name: 'Alp Aqua',          hex: '#3ABFBF',
      shapes: ['round','oval','pear','marquise','baguette','square','octagon-princess','octagon-step','heart'] },
    { id: 'paraiba',  name: 'Alpanite Paraiba',  hex: '#2DAFD4',
      shapes: ['round','oval','pear','marquise','baguette','square','octagon-princess','octagon-step','heart','asscher'] },
    { id: 'alp-brown',name: 'Alp Brown',         hex: '#8B5E3C', shapes: ['round'] },
    { id: 'yz-green', name: 'YZ Green (SP Green)',hex: '#4A9B5C', shapes: ['round'] },
    { id: 'blue113',  name: 'Blue 113 #',         hex: '#2E6FB0', shapes: ['round','oval','pear','marquise','princess','cushion','asscher','triangle','heart','baguette-step','octagon-step'] },
    { id: 'blue114',  name: 'Blue 114 #',         hex: '#1F5A95', shapes: ['round','oval','pear','marquise','princess','cushion','asscher','triangle','heart','baguette-step','octagon-step'] },
  ],
  multisapphire: [
    { id: 'multi', name: 'Multi Sapphire Strips', hex: '#1E3A8A' },
  ],
  cabochon: [
    { id: 'red',    name: 'Red',       hex: '#8B1E2E' },
    { id: 'green',  name: 'Green',     hex: '#0E5C4A' },
  ],
  highdensity: [
    { id: 'white',  name: 'White',      hex: '#F2EFE8' },
  ],
  corundum: [
    { id: 'ruby2',  name: 'Ruby 2',  hex: '#B23A4A' },
    { id: 'ruby3',  name: 'Ruby 3',  hex: '#9E2A3A' },
    { id: 'ruby5',  name: 'Ruby 5',  hex: '#8B1E2E' },
    { id: 'ruby8',  name: 'Ruby 8',  hex: '#6E1422' },
  ],
  labopal: [
    { id: 'white', name: 'White Opal Rainbow Fire', hex: '#EDE9DF',
      shapes: ['round','oval','pear','heart','marquise'] },
  ],
  opaque: [
    { id: 'red',   name: 'Red',   hex: '#C0432E' },
    { id: 'green', name: 'Green', hex: '#2E8C5C' },
  ],
  coral: [
    { id: 'red',   name: 'Coral Red',  hex: '#C0432E' },
    { id: 'milky', name: 'Milky White',hex: '#F0E6D2' },
    { id: 'pink',  name: 'Pink',       hex: '#E6A4B4' },
    { id: 'olive', name: 'Olive',      hex: '#7A7A3A' },
  ],
  polki: [{ id: 'default', name: 'Polki', hex: '#EFE6CF' }],
  evileye: [{ id: 'default', name: 'Evil Eye', hex: '#2A6FDB' }],
  bracelet: [
    { id: 'silver', name: 'Silver', hex: '#C0C2C4' }, { id: 'lavender', name: 'Lavender', hex: '#9B7BBF' },
    { id: 'wine', name: 'Wine', hex: '#6E1A2A' }, { id: 'royal', name: 'Royal Blue', hex: '#1E3A8A' },
    { id: 'white', name: 'White', hex: '#F2EFE8' }, { id: 'brown', name: 'Brown', hex: '#5A3A28' },
    { id: 'nightgrey', name: 'Night Grey', hex: '#4A4A48' }, { id: 'gold', name: 'Gold', hex: '#C9A227' },
    { id: 'skyblue', name: 'Sky Blue', hex: '#4FA6D8' }, { id: 'rosegold', name: 'Rose Gold', hex: '#C98A6E' },
    { id: 'orange', name: 'Orange', hex: '#D2691E' }, { id: 'navy', name: 'Navy Blue', hex: '#1B2A4A' },
    { id: 'pink', name: 'Pink', hex: '#E6A4B4' }, { id: 'green', name: 'Green', hex: '#2E6B3E' },
    { id: 'mocha', name: 'Mocha', hex: '#6B4A32' }, { id: 'teal', name: 'Teal Blue', hex: '#1F7A8C' },
    { id: 'champagne', name: 'Champagne', hex: '#D8C9A8' }, { id: 'red', name: 'Red', hex: '#C0202E' },
    { id: 'black', name: 'Black', hex: '#2A2A28' }, { id: 'magenta', name: 'Magenta', hex: '#C81E7A' },
    { id: 'greenapple', name: 'Green Apple', hex: '#4FA02E' },
  ],
  hollowmop: [{ id: 'default', name: 'MOP', hex: '#EFE9DD' }],
  labwhitecorundum: [{ id: 'default', name: 'White', hex: '#F2EFE8' }],
  alex: [{ id: 'default', name: 'Alexandrite', hex: '#6E7BB8' }],
  hotfix: [
    { id: 'crystal', name: 'Crystal',    hex: '#E6E9EC' },
    { id: 'white',   name: 'White',      hex: '#F2EFE8' },
    { id: 'red',     name: 'Siam Red',   hex: '#8B1E2E' },
    { id: 'royal',   name: 'Sapphire',   hex: '#1E3A8A' },
    { id: 'green',   name: 'Emerald',    hex: '#0E5C4A' },
    { id: 'pink',    name: 'Rose',       hex: '#E6A4B4' },
    { id: 'yellow',  name: 'Citrine',    hex: '#E2B43A' },
    { id: 'purple',  name: 'Amethyst',   hex: '#9C7DC2' },
    { id: 'black',   name: 'Jet Black',  hex: '#2A2A28' },
    { id: 'ab',      name: 'Aurora AB',  hex: '#B8A6D9' },
  ],
};

// ---- Unit of sale per category ----
// Carats: Multi Sapphires, Lab Grown, Beads.  Packets: Hotfix.  Everything else: pieces.
const PIECES_PER_PACKET = 144; // 1 gross per packet (hotfix chatons — fixed)

// Variable pieces-per-packet by size (the default for packet-sold goods).
// Smaller calibrated stones pack many more per packet. Anchored to the trade chart:
// 1.00 mm ≈ 1000 / packet, 4.00 mm ≈ 80, 8.00 mm ≈ 35. Override per SKU on bulk upload.
const PACKET_PCS_DEFAULT = {
  '1.00 mm': 1000, '1.25 mm': 700, '1.50 mm': 500, '1.75 mm': 360,
  '1.10 mm': 880, '1.20 mm': 760, '1.30 mm': 660, '1.40 mm': 580,
  '1.60 mm': 460, '1.70 mm': 420, '1.80 mm': 380, '1.90 mm': 340,
  '2.00 mm': 250,  '2.25 mm': 200, '2.50 mm': 170, '2.75 mm': 145,
  '3.00 mm': 130,  '3.25 mm': 120, '3.50 mm': 110, '3.75 mm': 95,
  '4.00 mm': 80,   '4.25 mm': 75,  '4.50 mm': 70,  '4.75 mm': 65,
  '5.00 mm': 60,   '5.25 mm': 56,  '5.50 mm': 52,  '5.75 mm': 50,
  '6.00 mm': 48,   '6.50 mm': 44,  '7.00 mm': 42,  '7.50 mm': 38, '8.00 mm': 35,
  // fancy L×W sizes
  '3×2 mm': 200, '4×3 mm': 130, '5×3 mm': 100, '5×4 mm': 80,
  '6×4 mm': 60,  '7×5 mm': 45,  '8×6 mm': 35,  '8×5 mm': 40, '4×2 mm': 250,
};
// Per-category overrides (rarely needed — the default curve covers most goods).
const PACKET_PCS_BY_CATEGORY = {};
// Pieces in one packet for a given category + size.
const packetPcs = (catId, size) => {
  if (catId === 'hotfix') return PIECES_PER_PACKET; // fixed gross
  if (catId === 'navratna') return 9; // a navratna set is 9 matched stones
  if (catId === 'ourosa') return 1440; // 10 gross per packet
  const over = PACKET_PCS_BY_CATEGORY[catId];
  if (over && over[size]) return over[size];
  return PACKET_PCS_DEFAULT[size] || PIECES_PER_PACKET;
};

// Carats contained in one Natural Multi Sapphire strip, by calibrated size.
const STRIP_CARATS_BY_SIZE = {
  '1.00 mm': 0.6, '1.25 mm': 0.9, '1.50 mm': 1.3, '1.75 mm': 1.8,
  '2.00 mm': 2.4, '2.25 mm': 3.0, '2.50 mm': 3.8, '2.75 mm': 4.6,
  '3.00 mm': 5.5, '3.25 mm': 6.5, '3.50 mm': 7.6, '3.75 mm': 8.8,
  '4.00 mm': 10, '4.25 mm': 11.5, '4.50 mm': 13, '4.75 mm': 14.5,
  '5.00 mm': 16, '5.50 mm': 20, '6.00 mm': 24, '6.50 mm': 28, '7.00 mm': 33,
  '3×2 mm': 3, '4×3 mm': 6, '5×3 mm': 8, '5×4 mm': 10,
  '6×4 mm': 12, '7×5 mm': 18, '8×6 mm': 26,
};
const stripCarats = (size) => STRIP_CARATS_BY_SIZE[size] || 2;

// Ourosa: PP sizes with mm equivalents.
const OUROSA_SIZES = [
  ['PP 0', '0.80 mm'], ['PP 1', '0.90 mm'], ['PP 2', '1.00 mm'], ['PP 3', '1.10 mm'],
  ['PP 4', '1.20 mm'], ['PP 5', '1.30 mm'], ['PP 6', '1.40 mm'], ['PP 7', '1.50 mm'],
  ['PP 8', '1.60 mm'], ['PP 9', '1.70 mm'], ['PP 10', '1.80 mm'],
];
const OUROSA_MM = Object.fromEntries(OUROSA_SIZES);
const ourosaMM = (pp) => OUROSA_MM[pp] || '';

// Natural full-drilled pearl strings: weight (grams) & price (₹) per ~16" string, by bead size.
const PEARL_STRING_WT_BY_SIZE = {
  '2.00 mm': 6, '3.00 mm': 10, '4.00 mm': 16, '5.00 mm': 24, '6.00 mm': 34,
  '7.00 mm': 46, '8.00 mm': 60, '9.00 mm': 76, '10.00 mm': 94,
};
const PEARL_STRING_PRICE_BY_SIZE = {
  '2.00 mm': 1200, '3.00 mm': 1800, '4.00 mm': 2600, '5.00 mm': 3600, '6.00 mm': 4800,
  '7.00 mm': 6200, '8.00 mm': 7800, '9.00 mm': 9600, '10.00 mm': 11600,
};
const pearlStringWt = (size) => PEARL_STRING_WT_BY_SIZE[size] || 0;
const pearlStringPrice = (size) => PEARL_STRING_PRICE_BY_SIZE[size] || 0;

// ---- Unit of sale per category ----
// By piece: Moissanite.  By carat: Lab Grown, Beads, Multi Sapphires.
// By packet (size-varying pcs): everything else.  Hotfix = fixed gross.
const UNIT_BY_CATEGORY = {
  moissanite:    'ct',
  labgrown:      'ct',
  beads:         'ct',
  multisapphire: 'ct',   // synthetic grade overrides to 'strip' at grade level
  // packet-sold categories
  laser:       'pkt', alpanite: 'pkt', cabochon: 'pkt', pearls: 'pkt',
  highdensity: 'pkt', corundum: 'pkt', labopal:  'pkt', opaque: 'pkt',
  cz:          'pkt', fancycut: 'pkt', mop:      'pc', navratna: 'pkt',
  coral:       'pkt', hotfix:   'pkt', whitecz:  'pkt', whitefancy: 'pkt', clover: 'pkt',
  icecut: 'pkt', ourosa: 'pkt',
  polki: 'pkt', evileye: 'pkt', bracelet: 'pc', hollowmop: 'pkt',
  labwhitecorundum: 'pkt', alex: 'pkt',
  rajkot: 'pkt',
};
const catUnit  = (catId) => UNIT_BY_CATEGORY[catId] || 'pc';
const unitMoq  = (unit) => unit === 'ct' ? 3 : 1;
// Natural vs Synthetic origin per category
const ORIGIN_BY_CATEGORY = {
  moissanite: 'Synthetic', laser: 'Synthetic', cz: 'Zirconia',
  whitecz: 'Zirconia', whitefancy: 'Zirconia', rajkot: 'Zirconia',
  labgrown: 'Synthetic', multisapphire: 'Synthetic', alpanite: 'Synthetic',
  corundum: 'Synthetic', highdensity: 'Zirconia', fancycut: 'Synthetic',
  labopal: 'Synthetic', hotfix: 'Synthetic', coral: 'Synthetic',
  mop: 'Natural / Synthetic', pearls: 'Natural / Cultured',
  cabochon: 'Natural / Synthetic', opaque: 'Natural / Synthetic',
  navratna: 'Natural / Synthetic', beads: 'Natural / Synthetic',
  clover: 'Natural / Synthetic',
  icecut: 'Synthetic',
  ourosa: 'Synthetic',
  polki: 'Uncut', evileye: 'Natural', bracelet: 'Fashion', hollowmop: 'Natural',
  labwhitecorundum: 'Lab Grown', alex: 'Lab Grown',
};
const catOrigin = (catId) => ORIGIN_BY_CATEGORY[catId] || 'Synthetic';
// Categories that show the "Wt / 1000 pcs" column (opt-in)
const WEIGHT_CATEGORIES = new Set(['highdensity', 'cabochon', 'whitecz']);
const catShowWeight = (catId) => WEIGHT_CATEGORIES.has(catId);
// Packet-sold categories that quote a flat price PER PACKET (not per piece).
const PACKET_PRICED = new Set(['pearls', 'ourosa', 'rajkot']);
const catPacketPriced = (catId) => PACKET_PRICED.has(catId);
const unitLabel = (unit) => unit === 'ct' ? 'ct' : unit === 'pkt' ? 'pkt' : unit === 'strip' ? 'strip' : 'pc';
const unitLabelLong = (unit) => unit === 'ct' ? 'carat' : unit === 'pkt' ? 'packet' : unit === 'strip' ? 'strip' : 'piece';
const unitPcsEach = (unit, size, catId) =>
  unit === 'ct' ? pcsPerCt(size) : unit === 'pkt' ? packetPcs(catId, size) : 1;
// price for one unit (carat / piece / packet / strip) at a given size
const unitRate = (product, size, unit, catId) =>
  unit === 'strip' ? product.price
  : unit === 'ct'  ? sizePerCtPrice(product, size)
  : unit === 'pkt' ? sizeUnitPrice(product, size) * packetPcs(catId, size)
  : sizeUnitPrice(product, size);
// total pieces represented by qty units
const unitToPcs = (unit, size, qty, catId) =>
  unit === 'ct'  ? Math.round(qty * pcsPerCt(size))
  : unit === 'pkt' ? qty * packetPcs(catId, size)
  : qty;

// Build a synthetic product object so the size order-pad can price a
// category + grade + colour + shape selection using the existing helpers.
function makeBrowseProduct(catId, grade, color, shape) {
  const unit = catUnit(catId);
  return {
    id: `EUR-${catId}-${grade.id}-${color.id}-${shape}`.toUpperCase(),
    name: `${color.name} ${findCategory(catId)?.short} ${grade.name}`,
    cat: catId,
    shape,
    tone: color.id,
    toneHex: color.hex,
    toneName: color.name,
    price: Math.round(grade.basePrice * (color.mult || 1)),
    foilCharge: grade.foilCharge || 0,
    moq: unitMoq(unit),
    unit: 'per ' + unit,
    unitMode: unit,
    clarity: grade.name,
    grade: grade.id,
  };
}

const VARIANT_MATRIX = {
  'EUR-MOI-0107': {
    shapes: ['round','oval','pear','princess','cushion','emerald','marquise','heart'],
    sizes: FULL_SIZES,
    qualities: ['VVS · DEF', 'VS · DEF', 'VVS · GH', 'VS · GH'],
    tiers: [
      { from: 1,    to: 49,    price: 1850 },
      { from: 50,   to: 199,   price: 1720 },
      { from: 200,  to: 499,   price: 1580 },
      { from: 500,  to: null,  price: 1440 },
    ],
  },
  'EUR-LAB-0518': {
    shapes: ['oval','round','pear','cushion','emerald','heart'],
    sizes: FULL_SIZES,
    qualities: ['AAA', 'AA', 'Eye-clean', 'Commercial'],
    tiers: [
      { from: 1,   to: 49,   price: 980 },
      { from: 50,  to: 199,  price: 880 },
      { from: 200, to: null, price: 780 },
    ],
  },
  'EUR-LAB-0724': {
    shapes: ['cushion','round','oval','heart','pear'],
    sizes: FULL_SIZES,
    qualities: ['AAA · Pigeon Blood', 'AA · Pigeon Blood', 'AAA · Vivid Red'],
    tiers: [
      { from: 1,   to: 24,   price: 1280 },
      { from: 25,  to: 99,   price: 1180 },
      { from: 100, to: null, price: 1080 },
    ],
  },
  'EUR-CZ-0301': {
    shapes: ['round','oval','pear','princess','cushion','marquise','emerald','baguette','heart','trillion'],
    sizes: FULL_SIZES,
    qualities: ['AAAAA · DEF', 'AAAA · DEF', 'AAA · GH'],
    tiers: [
      { from: 1,    to: 999,    price: 32 },
      { from: 1000, to: 4999,   price: 26 },
      { from: 5000, to: null,   price: 22 },
    ],
  },
};

// Apply matrix to every product as a default — every SKU gets full configurator
PRODUCTS.forEach(p => {
  if (!VARIANT_MATRIX[p.id]) {
    VARIANT_MATRIX[p.id] = {
      shapes: ['round','oval','pear','princess','cushion','emerald','marquise','heart'],
      sizes: FULL_SIZES,
      qualities: [p.clarity, 'Commercial', 'AA'],
      tiers: [
        { from: 1,        to: p.moq * 5 - 1, price: p.price },
        { from: p.moq * 5, to: p.moq * 20 - 1, price: Math.round(p.price * 0.92) },
        { from: p.moq * 20, to: null,         price: Math.round(p.price * 0.85) },
      ],
    };
  }
});

// Resolve effective price + tier for qty
const priceForQty = (product, qty) => {
  const m = VARIANT_MATRIX[product.id];
  if (!m || !m.tiers) return product.price;
  const tier = m.tiers.find(t => qty >= t.from && (t.to == null || qty <= t.to));
  return tier ? tier.price : m.tiers[0].price;
};

const STATUS_META = {
  pending:   { label: 'Awaiting confirmation', tone: 'warn',   short: 'Pending' },
  confirmed: { label: 'Confirmed',             tone: 'info',   short: 'Confirmed' },
  packed:    { label: 'Packed',                tone: 'info',   short: 'Packed' },
  shipped:   { label: 'In transit',            tone: 'accent', short: 'Shipped' },
  delivered: { label: 'Delivered',             tone: 'accent', short: 'Delivered' },
  cancelled: { label: 'Cancelled',             tone: 'danger', short: 'Cancelled' },
};

const TIMELINE_STAGES = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];

// Helpers
const findProduct = (id) => PRODUCTS.find(p => p.id === id);
const findTone = (id) => TONES.find(t => t.id === id);
// Shapes added in Admin (or arriving with a bulk upload) are not in the
// built-in SHAPES table, and every screen reads the name from here — so an
// unknown shape rendered as a blank card title. Fall back to a readable name
// derived from the id ("tapered-baguette" -> "Tapered Baguette"). The
// synthesised entry deliberately has no subShapes/note, so callers that check
// those keep behaving exactly as before.
const shapeNameFromId = (id) =>
  String(id || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
const findShape = (id) => SHAPES.find(s => s.id === id) || (id ? { id, name: shapeNameFromId(id) } : undefined);
const findCategory = (id) => CATEGORIES.find(c => c.id === id);

const formatINR = (n) => '₹' + n.toLocaleString('en-IN');

const orderTotal = (order) =>
  order.lines.reduce((s, l) => s + (findProduct(l.pid)?.price || 0) * l.qty, 0);

const orderQty = (order) =>
  order.lines.reduce((s, l) => s + l.qty, 0);

// The API serialises an order's lines under "items", and sends none of the demo
// book's "date" / "ship" fields (see serialiseOrder in src/routes/orders.ts).
// Orders saved locally already carry the shape the screens read, so server rows
// are normalised to that one rather than teaching every screen to speak both.
// Without this, o.lines is undefined and the Orders screen throws on render —
// which only ever showed up for Back Office, because office sees every order
// while a new customer has none and quietly lands on the empty state.
const normaliseOrder = (order) => {
  if (!order || Array.isArray(order.lines)) return order;
  const items = Array.isArray(order.items) ? order.items : [];
  return Object.assign({}, order, {
    lines: items.map((l) => Object.assign({}, l, { pid: l.pid, qty: l.qty || 0 })),
    date: order.date || order.createdAt || (order.ts ? new Date(order.ts).toISOString() : ''),
    // The charged total, so the invoice never drifts from list-price maths.
    placedTotal: typeof order.placedTotal === 'number' ? order.placedTotal
               : typeof order.grand === 'number' ? order.grand : undefined,
    ship: order.ship || '',
    // Staff order lists read custName; the API calls it "customer". Without
    // this the list falls back to the demo customer book and labels real
    // orders with invented names.
    custName: order.custName || order.customer || '',
    custPhone: order.custPhone || '',
  });
};

// Per-size derivations
const pcsPerCt = (size) => PCS_PER_CT[size] || 4;
const sizeUnitPrice = (product, size) => {
  const mult = SIZE_PRICE_MULTI[size] || 1;
  return Math.max(1, Math.round(product.price * mult));
};
// Price per carat for a given size = price/piece × pieces/ct
const sizePerCtPrice = (product, size) => Math.round(sizeUnitPrice(product, size) * pcsPerCt(size));

// ---- Uploaded SKUs -> real sizes -------------------------------------------
// The size pads used to read their rows out of the built-in size charts
// (FULL_SIZES / SIZES_BY_CATEGORY), falling back to a single hardcoded
// "4.00 mm" row. A category created in Admin and filled by bulk upload has no
// entry in those charts, so every shape showed exactly one 4.00 mm row no
// matter how many sizes were uploaded. These read the real SKUs instead.

const sameShape = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

/** Uploaded SKUs for a category + shape. When the upload carries a grade in
 *  its clarity/tone column and it matches the chosen grade, narrow to those —
 *  but never narrow to nothing, so a CSV without grade info still lists. */
function uploadedSkusFor(catId, shape, grade) {
  const all = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []) || [];
  const list = all.filter((p) => p && p.cat === catId && sameShape(p.shape, shape));
  if (!list.length || !grade) return list;
  const want = [grade.id, grade.name].filter(Boolean).map((x) => String(x).trim().toLowerCase());
  const narrowed = list.filter((p) => {
    const c = String(p.clarity || '').trim().toLowerCase();
    const t = String(p.tone || '').trim().toLowerCase();
    return want.some((w) => w === c || w === t);
  });
  return narrowed.length ? narrowed : list;
}

/** Distinct sizes actually uploaded for a category + shape, in upload order. */
function uploadedSizesFor(catId, shape, grade) {
  const seen = {};
  const out = [];
  uploadedSkusFor(catId, shape, grade).forEach((p) => {
    const s = p.size;
    if (s && !seen[s]) { seen[s] = 1; out.push(s); }
  });
  return out;
}

/** The uploaded SKU behind one row, so its price/MOQ/stock drive that row. */
function uploadedSkuFor(catId, shape, size, grade) {
  return uploadedSkusFor(catId, shape, grade).find((p) => String(p.size) === String(size)) || null;
}

Object.assign(window, { uploadedSkusFor, uploadedSizesFor, uploadedSkuFor });

// ===== Live stock validation =====
// The cart holds lines that were priced and sized minutes ago; another customer
// may have taken the stock since. These ask the server what is actually left.
// The server's atomic decrement at order time remains the authority — a pass
// here is advisory, because the last pieces can go between this call and that.

/** Ask the server what is available for these lines. Returns [] when offline or
 *  when nothing is trackable, so a failed check never blocks an order on its own. */
function checkStock(lines) {
  const payload = (lines || [])
    .map((l) => ({ pid: l.pid, qty: l.qty || 0 }))
    .filter((l) => l.pid && l.qty > 0);
  if (!payload.length) return Promise.resolve([]);
  return fetch((window.EUROSTAR_API || location.origin) + '/catalog/stock-check', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lines: payload }),
  })
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((d) => (Array.isArray(d.items) ? d.items : []))
    .catch(() => []); // offline: let the server decide at placement
}

/** Only the lines that cannot be fulfilled at their current quantity. */
const stockShortfalls = (items) => (items || []).filter((i) => !i.ok);

/** Customer-facing wording for one shortfall. */
function stockMessage(item) {
  if (!item) return '';
  const what = item.name || item.pid;
  if (item.available <= 0) return `${what} is out of stock.`;
  const unit = item.available === 1 ? 'unit' : 'units';
  return `Only ${item.available} ${unit} of ${what} ${item.available === 1 ? 'is' : 'are'} available.`;
}

Object.assign(window, { checkStock, stockShortfalls, stockMessage });

// ===========================================================================
// MOISSANITE weight chart (actual Eurostar reference chart).
// Per shape, per size: ctEach = carat weight of ONE stone.
// Melee (small) sizes are ordered by carat; larger sizes (>= threshold) are
// entered by piece but billed by carat. pcs/ct derives from ctEach.
// Only the 8 shapes Moissanite offers are included.
// ===========================================================================
const MOISS_CHART = {
  round: [
    ['0.70 mm',0.001724],['0.80 mm',0.002439],['0.90 mm',0.003448],['1.00 mm',0.004762],
    ['1.10 mm',0.00625],['1.20 mm',0.008],['1.25 mm',0.008772],['1.30 mm',0.01],
    ['1.40 mm',0.012821],['1.50 mm',0.015625],['1.60 mm',0.017241],['1.70 mm',0.021277],
    ['1.75 mm',0.023256],['1.80 mm',0.025],['1.90 mm',0.029412],['2.00 mm',0.035714],
    ['2.10 mm',0.038462],['2.20 mm',0.045455],['2.25 mm',0.047619],['2.30 mm',0.052632],
    ['2.40 mm',0.055556],['2.50 mm',0.0625],['2.60 mm',0.071429],['2.70 mm',0.076923],
    ['2.75 mm',0.076923],['2.80 mm',0.083333],['2.90 mm',0.1],
    ['3.00 mm',0.1],['3.10 mm',0.12],['3.20 mm',0.14],['3.25 mm',0.15],['3.30 mm',0.16],
    ['3.40 mm',0.18],['3.50 mm',0.2],['3.60 mm',0.22],['3.70 mm',0.24],['3.75 mm',0.25],
    ['3.80 mm',0.26],['3.90 mm',0.28],['4.00 mm',0.3],['4.25 mm',0.35],['4.50 mm',0.4],
    ['4.75 mm',0.45],['5.00 mm',0.5],['5.25 mm',0.55],['5.50 mm',0.6],['5.75 mm',0.7],
    ['6.00 mm',0.8],['6.50 mm',1],['6.75 mm',1.1],['7.00 mm',1.2],['7.25 mm',1.3],
    ['7.50 mm',1.5],['8.00 mm',2],['8.25 mm',2.25],['8.50 mm',2.5],['9.00 mm',3],
    ['9.50 mm',3.5],['10.00 mm',4],['10.50 mm',4.5],['11.00 mm',5],['11.50 mm',5.5],
    ['12.00 mm',6],['12.50 mm',7],['13.00 mm',8],['14.00 mm',10],['15.00 mm',12],
    ['16.00 mm',15],['18.00 mm',20],['20.00 mm',30],
  ],
  oval: [
    ['1.5×2.5 mm',0.03],['1.5×3 mm',0.039],['2×3 mm',0.058],['2×4 mm',0.074],
    ['2.5×3.5 mm',0.102],['3×4 mm',0.17],['3×5 mm',0.22],['4×5 mm',0.36],['4×6 mm',0.44],
    ['5×7 mm',0.79],['6×8 mm',1.25],['6×9 mm',1.51],['7×9 mm',1.95],['7×10 mm',2.14],
    ['7×11 mm',2.46],['8×10 mm',2.75],['8×12 mm',3.35],['9×11 mm',3.52],['10×14 mm',6.02],
    ['12×16 mm',10.09],
  ],
  emerald: [
    ['1.5×2.5 mm',0.038],['1.5×3 mm',0.046],['2×3 mm',0.074],['2×4 mm',0.106],
    ['2.5×3.5 mm',0.128],['2.5×5 mm',0.211],['3×4 mm',0.2],['3×5 mm',0.281],['4×6 mm',0.6],
    ['5×7 mm',1.05],['6×8 mm',1.7],['7×9 mm',2.52],['7×10 mm',2.85],['8×10 mm',3.62],
    ['9×11 mm',5.03],['10×12 mm',6.67],['10×14 mm',7.95],
  ],
  pear: [
    ['1.5×2.5 mm',0.025],['1.5×3 mm',0.029],['2×3 mm',0.05],['2×3.5 mm',0.059],['2×4 mm',0.071],
    ['2.5×3.5 mm',0.085],['2.5×4 mm',0.103],['3×4 mm',0.14],['3×5 mm',0.18],['4×5 mm',0.32],
    ['4×6 mm',0.38],['5×7 mm',0.71],['5×8 mm',0.78],['6×8 mm',0.97],['6×9 mm',1.27],
    ['7×9 mm',1.48],['7×10 mm',1.85],['7×11 mm',1.92],['8×10 mm',2.47],['8×11 mm',2.7],
    ['8×12 mm',3.09],['9×11 mm',3.27],['9×13 mm',5.38],['10×12 mm',4.3],['10×14 mm',5],
  ],
  heart: [
    ['3×3 mm',0.11],['3.5×3.5 mm',0.16],['4×4 mm',0.25],['4.5×4.5 mm',0.35],['5×5 mm',0.46],
    ['5.5×5.5 mm',0.65],['6×6 mm',0.85],['6.5×6.5 mm',1.06],['7×7 mm',1.37],['7.5×7.5 mm',1.62],
    ['8×8 mm',1.93],['9×9 mm',2.73],['10×10 mm',3.98],['11×11 mm',4.34],
  ],
  princess: [
    ['3×3 mm',0.15],['3.5×3.5 mm',0.24],['4×4 mm',0.36],['4.5×4.5 mm',0.51],['5×5 mm',0.64],
    ['5.5×5.5 mm',0.9],['6×6 mm',1.2],['6.5×6.5 mm',1.54],['7×7 mm',1.89],['7.5×7.5 mm',2.36],
    ['8×8 mm',2.61],['8.5×8.5 mm',3.47],['9×9 mm',3.86],['10×10 mm',6.26],['11×11 mm',8.26],
  ],
  cushion: [
    ['3×3 mm',0.13],['3.5×3.5 mm',0.2],['4×4 mm',0.31],['4.5×4.5 mm',0.42],['5×5 mm',0.6],
    ['5.5×5.5 mm',0.78],['6×6 mm',1.08],['6.5×6.5 mm',1.32],['7×7 mm',1.67],['7.5×7.5 mm',1.9],
    ['8×8 mm',2.47],['9×9 mm',3.42],['10×10 mm',4.72],['11×11 mm',5.17],
  ],
  marquise: [
    ['3×5 mm',0.17],['3×6 mm',0.22],['3.5×7 mm',0.35],['4×8 mm',0.52],['5×10 mm',1],
    ['6×12 mm',1.88],['7×14 mm',2.72],['8×16 mm',4.03],
  ],
  // Added from the Moissanite Size & Weight chart (ct = weight of one stone).
  asscher: [['3×3 mm',0.15],['3.5×3.5 mm',0.24],['4×4 mm',0.34],['4.5×4.5 mm',0.49],['5×5 mm',0.71],['5.5×5.5 mm',0.92],['6×6 mm',1.2],['6.5×6.5 mm',1.46],['7×7 mm',1.18],['7.5×7.5 mm',2.19],['8×8 mm',2.85],['8.5×8.5 mm',3.3],['9×9 mm',3.89],['9.5×9.5 mm',4.65],['10×10 mm',5.12],['11×11 mm',7.08]],
  radiant: [['3×5 mm',0.28],['4×6 mm',0.57],['5×7 mm',0.98],['6×8 mm',1.59],['7×9 mm',2.45],['8×10 mm',3.5],['9×11 mm',4.88],['10×12 mm',6.4],['10×14 mm',8.48]],
  trillion: [['3×3 mm',0.11],['3.5×3.5 mm',0.16],['4×4 mm',0.25],['4.5×4.5 mm',0.34],['5×5 mm',0.49],['5.5×5.5 mm',0.64],['6×6 mm',0.74],['6.5×6.5 mm',1.04],['7×7 mm',1.27],['7.5×7.5 mm',1.42],['8×8 mm',1.86],['8.5×8.5 mm',2.05],['9×9 mm',2.67],['10×10 mm',3.42]],
  triangle: [['3×3 mm',0.09],['3.5×3.5 mm',0.14],['4×4 mm',0.21],['4.5×4.5 mm',0.29],['5×5 mm',0.45],['5.5×5.5 mm',0.46],['6×6 mm',0.7],['6.5×6.5 mm',0.77],['7×7 mm',1.1],['7.5×7.5 mm',1.32],['8×8 mm',1.59],['9×9 mm',2.19],['10×10 mm',3.25]],
  'square-radiant': [['5 mm',0.76],['6 mm',1.17],['6.5 mm',1.44],['7 mm',1.66],['7.5 mm',2.16],['8 mm',2.72],['8.5 mm',3.17],['9 mm',3.67]],
  star: [['5 mm',0.41],['6 mm',0.68]],
  tapered: [['1×1.25×1.5 mm',0.014],['1×1.25×2 mm',0.02],['1×1.5×1.75 mm',0.02],['1×1.5×2 mm',0.025],['1×1.5×2.5 mm',0.031],['1×1.5×3 mm',0.035],['1×1.5×3.5 mm',0.046],['1×2×2.5 mm',0.05],['1×2×3 mm',0.06],['1.5×2×2.5 mm',0.055],['1.5×2×3 mm',0.068],['1.5×2×3.5 mm',0.08],['1.5×2×4 mm',0.08],['1.5×2.5×3 mm',0.08],['2×3×4 mm',0.19],['2×3×5 mm',0.23],['2×4×5 mm',0.35],['2×3×6 mm',0.28],['2.5×3×5 mm',0.27]],
  baguette: [['1×1.25 mm',0.01],['1×1.3 mm',0.01],['1×1.4 mm',0.01],['1×1.5 mm',0.012],['1×1.75 mm',0.013],['1×2 mm',0.016],['1×2.5 mm',0.021],['1×2.75 mm',0.025],['1.25×1.75 mm',0.018],['1.25×2 mm',0.023],['1.25×2.25 mm',0.025],['1.25×2.5 mm',0.029],['1.5×1.75 mm',0.025],['1.5×2 mm',0.03],['1.5×2.25 mm',0.035],['1.5×2.5 mm',0.037],['1.5×3 mm',0.045],['1.5×3.5 mm',0.058],['1.5×4 mm',0.075],['2×2.5 mm',0.067],['2×2.75 mm',0.071],['2×3 mm',0.079],['2×3.5 mm',0.095],['2×4 mm',0.118],['2×4.5 mm',0.137],['2.5×3 mm',0.116],['2.5×4 mm',0.161],['2.5×5 mm',0.21],['3×4 mm',0.2],['3×5 mm',0.31],['3×6 mm',0.36],['4×6 mm',0.61]],
};
// Size at/above which a Moissanite shape switches from carat-input to piece-input
// (also the size at/above which the optional ₹80/pc certificate is offered).
const MOISS_PIECE_FROM = {
  round: '6.00 mm', princess: '6×6 mm', cushion: '6×6 mm', heart: '6×6 mm',
  oval: '5×7 mm', pear: '5×7 mm', emerald: '5×7 mm', marquise: '3×6 mm',
  // New shapes — same treatment (piece-input + optional certificate above these).
  asscher: '6×6 mm', trillion: '6×6 mm', triangle: '6×6 mm', radiant: '6×8 mm',
  'square-radiant': '6 mm', star: '6 mm',
  // tapered & baguette stay carat-input at every size (no certificate) by design.
};
const moissSizes    = (shape) => (MOISS_CHART[shape] || []).map((r) => r[0]);
const moissCtEach   = (shape, size) => {
  const row = (MOISS_CHART[shape] || []).find((r) => r[0] === size);
  return row ? row[1] : 0.1;
};
const moissPcsPerCt = (shape, size) => Math.max(1, Math.round(1 / moissCtEach(shape, size)));
const moissSizeIndex = (shape, size) => (MOISS_CHART[shape] || []).findIndex((r) => r[0] === size);
const moissIsPiece  = (shape, size) => {
  const from = MOISS_PIECE_FROM[shape];
  if (!from) return false;
  const i = moissSizeIndex(shape, size), t = moissSizeIndex(shape, from);
  return i >= 0 && t >= 0 && i >= t;
};

// Per-size, per-grade Moissanite rate in ₹/carat, from the uploaded price sheet.
// [DEF ₹/ct, GH ₹/ct] for each shape + size. moissRate() returns the rate, or
// null when a size/grade is absent so the caller falls back to the grade's flat
// basePrice.
const MOISS_PRICE = {
  'round': {'0.70 mm':[221,103.5],'0.80 mm':[221,103.5],'0.90 mm':[221,103.5],'1.00 mm':[152,103.5],'1.10 mm':[152,103.5],'1.20 mm':[152,103.5],'1.25 mm':[152,103.5],'1.30 mm':[152,103.5],'1.40 mm':[152,103.5],'1.50 mm':[152,94.5],'1.60 mm':[134,94.5],'1.70 mm':[134,94.5],'1.75 mm':[134,94.5],'1.80 mm':[134,94.5],'1.90 mm':[134,94.5],'2.00 mm':[134,94.5],'2.10 mm':[115,94.5],'2.20 mm':[115,94.5],'2.25 mm':[115,94.5],'2.30 mm':[115,94.5],'2.40 mm':[115,94.5],'2.50 mm':[115,85.5],'2.60 mm':[115,85.5],'2.70 mm':[115,85.5],'2.75 mm':[115,85.5],'2.80 mm':[115,81.9],'2.90 mm':[115,81.9],'3.00 mm':[105,81.9],'3.10 mm':[105,81.9],'3.20 mm':[105,81.9],'3.25 mm':[105,81.9],'3.30 mm':[105,81.9],'3.40 mm':[105,81.9],'3.50 mm':[105,81.9],'3.60 mm':[105,81.9],'3.70 mm':[105,81.9],'3.75 mm':[105,81.9],'3.80 mm':[105,81.9],'3.90 mm':[105,81.9],'4.00 mm':[95,81.9],'4.25 mm':[95,81.9],'4.50 mm':[95,81.9],'4.75 mm':[95,81.9],'5.00 mm':[91,81.9],'5.25 mm':[91,81.9],'5.50 mm':[91,81.9],'5.75 mm':[91,81.9],'6.00 mm':[91,81.9],'6.50 mm':[91,121.5],'6.75 mm':[91,121.5],'7.00 mm':[91,121.5],'7.25 mm':[91,121.5],'7.50 mm':[91,260.1],'8.00 mm':[91,260.1],'8.25 mm':[91,222.3],'8.50 mm':[91,222.3],'9.00 mm':[91,200.7],'9.50 mm':[91,200.7],'10.00 mm':[91,200.7],'10.50 mm':[91,136.8],'11.00 mm':[91,136.8],'11.50 mm':[91,136.8],'12.00 mm':[91,136.8],'12.50 mm':[91,136.8],'13.00 mm':[91,136.8],'14.00 mm':[91,136.8],'15.00 mm':[135,136.8],'16.00 mm':[135,136.8],'18.00 mm':[135,136.8],'20.00 mm':[135,136.8]},
  'oval': {'1.5×2.5 mm':[289,136.8],'1.5×3 mm':[289,136.8],'2×3 mm':[247,260.1],'2×4 mm':[247,260.1],'2.5×3.5 mm':[223,222.3],'3×4 mm':[223,222.3],'3×5 mm':[223,222.3],'4×5 mm':[152,200.7],'4×6 mm':[152,200.7],'5×7 mm':[152,136.8],'6×8 mm':[152,136.8],'6×9 mm':[152,136.8],'7×9 mm':[152,136.8],'7×10 mm':[152,136.8],'7×11 mm':[152,136.8],'8×10 mm':[152,136.8],'8×12 mm':[152,136.8],'9×11 mm':[152,136.8],'10×14 mm':[152,136.8],'12×16 mm':[152,136.8]},
  'pear': {'1.5×2.5 mm':[289,136.8],'1.5×3 mm':[289,136.8],'2×3 mm':[247,136.8],'2×3.5 mm':[247,136.8],'2×4 mm':[247,136.8],'2.5×3.5 mm':[223,136.8],'2.5×4 mm':[223,136.8],'3×4 mm':[152,200.7],'3×5 mm':[152,136.8],'4×5 mm':[152,136.8],'4×6 mm':[152,136.8],'5×7 mm':[152,136.8],'5×8 mm':[152,136.8],'6×8 mm':[152,136.8],'6×9 mm':[152,136.8],'7×9 mm':[152,136.8],'7×10 mm':[152,136.8],'7×11 mm':[152,136.8],'8×10 mm':[152,136.8],'8×11 mm':[152,136.8],'8×12 mm':[152,136.8],'9×11 mm':[152,136.8],'9×13 mm':[152,200.7],'10×12 mm':[152,136.8],'10×14 mm':[152,136.8]},
  'princess': {'3×3 mm':[223,136.8],'3.5×3.5 mm':[152,136.8],'4×4 mm':[152,136.8],'4.5×4.5 mm':[152,136.8],'5×5 mm':[152,136.8],'5.5×5.5 mm':[152,136.8],'6×6 mm':[152,136.8],'6.5×6.5 mm':[152,136.8],'7×7 mm':[152,136.8],'7.5×7.5 mm':[152,136.8],'8×8 mm':[152,136.8],'8.5×8.5 mm':[152,260.1],'9×9 mm':[152,260.1],'10×10 mm':[152,222.3],'11×11 mm':[152,222.3]},
  'cushion': {'3×3 mm':[223,136.8],'3.5×3.5 mm':[152,136.8],'4×4 mm':[152,136.8],'4.5×4.5 mm':[152,136.8],'5×5 mm':[152,136.8],'5.5×5.5 mm':[152,136.8],'6×6 mm':[152,136.8],'6.5×6.5 mm':[152,136.8],'7×7 mm':[152,136.8],'7.5×7.5 mm':[152,136.8],'8×8 mm':[152,136.8],'9×9 mm':[152,136.8],'10×10 mm':[152,136.8],'11×11 mm':[152,260.1]},
  'emerald': {'1.5×2.5 mm':[289,260.1],'1.5×3 mm':[289,136.8],'2×3 mm':[247,136.8],'2×4 mm':[247,136.8],'2.5×3.5 mm':[152,136.8],'2.5×5 mm':[152,136.8],'3×4 mm':[152,136.8],'3×5 mm':[152,260.1],'4×6 mm':[152,136.8],'5×7 mm':[152,136.8],'6×8 mm':[152,136.8],'7×9 mm':[152,136.8],'7×10 mm':[152,136.8],'8×10 mm':[152,136.8],'9×11 mm':[152,136.8],'10×12 mm':[152,136.8],'10×14 mm':[152,136.8]},
  'marquise': {'3×5 mm':[289,136.8],'3×6 mm':[289,136.8],'3.5×7 mm':[152,136.8],'4×8 mm':[152,136.8],'5×10 mm':[152,260.1],'6×12 mm':[152,136.8],'7×14 mm':[152,136.8],'8×16 mm':[152,136.8]},
  'heart': {'3×3 mm':[289,136.8],'3.5×3.5 mm':[152,136.8],'4×4 mm':[152,136.8],'4.5×4.5 mm':[152,136.8],'5×5 mm':[152,136.8],'5.5×5.5 mm':[152,136.8],'6×6 mm':[152,136.8],'6.5×6.5 mm':[152,136.8],'7×7 mm':[152,136.8],'7.5×7.5 mm':[152,136.8],'8×8 mm':[152,136.8],'9×9 mm':[152,136.8],'10×10 mm':[152,260.1],'11×11 mm':[152,136.8]},
  'asscher': {'3×3 mm':[289,136.8],'3.5×3.5 mm':[152,136.8],'4×4 mm':[152,136.8],'4.5×4.5 mm':[152,136.8],'5×5 mm':[152,136.8],'5.5×5.5 mm':[152,136.8],'6×6 mm':[152,136.8],'6.5×6.5 mm':[152,260.1],'7×7 mm':[152,136.8],'7.5×7.5 mm':[152,136.8],'8×8 mm':[152,136.8],'8.5×8.5 mm':[152,136.8],'9×9 mm':[152,136.8],'9.5×9.5 mm':[152,136.8],'10×10 mm':[152,136.8],'11×11 mm':[152,136.8]},
  'radiant': {'3×5 mm':[289,136.8],'4×6 mm':[152,136.8],'5×7 mm':[152,136.8],'6×8 mm':[152,136.8],'7×9 mm':[152,136.8],'8×10 mm':[152,260.1],'9×11 mm':[152,136.8],'10×12 mm':[152,136.8],'10×14 mm':[152,136.8]},
  'trillion': {'3×3 mm':[289,136.8],'3.5×3.5 mm':[152,136.8],'4×4 mm':[152,136.8],'4.5×4.5 mm':[152,136.8],'5×5 mm':[152,136.8],'5.5×5.5 mm':[152,136.8],'6×6 mm':[152,136.8],'6.5×6.5 mm':[152,136.8],'7×7 mm':[152,136.8],'7.5×7.5 mm':[152,136.8],'8×8 mm':[152,136.8],'8.5×8.5 mm':[152,136.8],'9×9 mm':[152,136.8],'10×10 mm':[152,136.8]},
  'triangle': {'3×3 mm':[289,136.8],'3.5×3.5 mm':[152,136.8],'4×4 mm':[152,136.8],'4.5×4.5 mm':[152,136.8],'5×5 mm':[152,136.8],'5.5×5.5 mm':[152,362.7],'6×6 mm':[152,328.5],'6.5×6.5 mm':[152,362.7],'7×7 mm':[152,328.5],'7.5×7.5 mm':[152,328.5],'8×8 mm':[152,328.5],'9×9 mm':[152,328.5],'10×10 mm':[152,328.5]},
  'square-radiant': {'5 mm':[152,328.5],'6 mm':[152,328.5],'6.5 mm':[152,328.5],'7 mm':[152,328.5],'7.5 mm':[152,328.5],'8 mm':[152,328.5],'8.5 mm':[152,328.5],'9 mm':[152,328.5]},
  'star': {'5 mm':[152,328.5],'6 mm':[152,328.5]},
  'tapered': {'1×1.25×1.5 mm':[403,403],'1×1.25×2 mm':[365,365],'1×1.5×1.75 mm':[403,403],'1×1.5×2 mm':[365,365],'1×1.5×2.5 mm':[365,365],'1×1.5×3 mm':[365,365],'1×1.5×3.5 mm':[365,365],'1×2×2.5 mm':[365,365],'1×2×3 mm':[365,365],'1.5×2×2.5 mm':[365,365],'1.5×2×3 mm':[365,365],'1.5×2×3.5 mm':[365,365],'1.5×2×4 mm':[365,365],'1.5×2.5×3 mm':[365,365],'2×3×4 mm':[365,365],'2×3×5 mm':[365,365],'2×4×5 mm':[365,365],'2×3×6 mm':[365,365],'2.5×3×5 mm':[365,365]},
  'baguette': {'1×1.25 mm':[403,403],'1×1.3 mm':[403,403],'1×1.4 mm':[403,403],'1×1.5 mm':[403,403],'1×1.75 mm':[403,403],'1×2 mm':[365,365],'1×2.5 mm':[365,365],'1×2.75 mm':[365,365],'1.25×1.75 mm':[365,365],'1.25×2 mm':[365,365],'1.25×2.25 mm':[365,365],'1.25×2.5 mm':[365,365],'1.5×1.75 mm':[365,365],'1.5×2 mm':[365,365],'1.5×2.25 mm':[365,365],'1.5×2.5 mm':[365,365],'1.5×3 mm':[365,365],'1.5×3.5 mm':[365,365],'1.5×4 mm':[365,365],'2×2.5 mm':[365,365],'2×2.75 mm':[365,365],'2×3 mm':[365,365],'2×3.5 mm':[365,365],'2×4 mm':[365,365],'2×4.5 mm':[365,365],'2.5×3 mm':[365,365],'2.5×4 mm':[365,365],'2.5×5 mm':[365,365],'3×4 mm':[365,365],'3×5 mm':[365,365],'3×6 mm':[365,365],'4×6 mm':[365,365]},
};
function moissRate(shape, size, gradeId) {
  const row = MOISS_PRICE[shape] && MOISS_PRICE[shape][size];
  if (!row) return null;
  const v = gradeId === 'def' ? row[0] : gradeId === 'gh' ? row[1] : null;
  return (typeof v === 'number' && v > 0) ? v : null;
}
window.moissRate = moissRate;

// Euro Alp Green (Alpanite) price sheet — box-sold. Each row: [size, pcs per
// box, final ₹ per piece]. Same price for every colour is NOT assumed — this
// applies ONLY to the 'green' (Euro Alp Green) colour. Oval & Pear share one
// table; Trillion/Triangle/Cushion/Asscher share another.
const ALP_OVALPEAR = [
  ['3×2 mm',500,5.60],['2.5×3 mm',500,6.44],['3×4 mm',200,7.56],['3×5 mm',200,8.96],['4×5 mm',200,11.20],
  ['4×6 mm',200,12.60],['5×7 mm',200,18.20],['6×8 mm',100,25.20],['7×9 mm',100,36.40],['8×10 mm',100,50.40],
  ['11×9 mm',100,56.00],['9×6 mm',100,27.25],['12×8 mm',50,70.00],['14×10 mm',25,154.00],['12×10 mm',25,84.00],
];
const ALP_TTCA = [
  ['3×3 mm',500,7.00],['3.5×3.5 mm',500,7.84],['4×4 mm',200,9.80],['5×5 mm',200,14.00],['6×6 mm',200,21.00],
  ['7×7 mm',100,26.60],['8×8 mm',100,36.40],['9×9 mm',100,51.80],['10×10 mm',50,70.00],
];
const ALP_GREEN = {
  round: [
    ['0.80 mm',1000,0.42],['0.90 mm',1000,0.34],['1.00 mm',1000,0.31],['1.10 mm',1000,0.34],['1.20 mm',1000,0.39],
    ['1.25 mm',1000,0.42],['1.30 mm',1000,0.50],['1.40 mm',1000,0.59],['1.50 mm',1000,0.67],['1.60 mm',1000,0.78],
    ['1.70 mm',1000,0.90],['1.75 mm',1000,0.95],['1.80 mm',1000,1.01],['1.90 mm',1000,1.06],['2.00 mm',1000,1.12],
    ['2.10 mm',500,1.26],['2.25 mm',500,1.68],['2.50 mm',500,2.10],['2.75 mm',500,2.66],['2.80 mm',500,2.80],
    ['3.00 mm',500,3.22],['3.25 mm',200,3.64],['3.50 mm',200,4.48],['3.75 mm',200,5.60],['4.00 mm',200,6.72],
    ['4.25 mm',200,8.40],['4.50 mm',200,9.80],['4.75 mm',200,12.60],['5.00 mm',200,14.00],['6.50 mm',100,18.20],
    ['6.75 mm',100,28.00],['7.00 mm',50,29.40],['7.50 mm',50,36.40],['8.00 mm',50,42.00],
  ],
  'baguette-step': [
    ['3×1.5 mm',500,3.22],['4×2 mm',500,4.20],['5×2.5 mm',500,5.60],['6×3 mm',200,7.56],['7×3.5 mm',200,11.76],
    ['8×4 mm',200,15.68],['10×5 mm',200,26.60],['12×9 mm',100,37.80],
  ],
  oval: ALP_OVALPEAR,
  pear: ALP_OVALPEAR,
  marquise: [
    ['3×1.5 mm',500,4.62],['4×2 mm',500,5.88],['5×2.5 mm',500,7.84],['6×3 mm',200,10.08],['7×3.5 mm',200,14.00],
    ['8×4 mm',100,19.60],['10×5 mm',100,28.00],['12×6 mm',100,44.80],
  ],
  'octagon-step': [
    ['4×3 mm',500,8.96],['5×3 mm',200,9.24],['5×4 mm',200,12.04],['6×4 mm',200,12.88],['7×5 mm',100,18.20],
    ['8×6 mm',100,26.60],['9×7 mm',100,42.00],['10×8 mm',50,56.00],['11×9 mm',50,190.40],['12×10 mm',50,218.40],
    ['14×10 mm',50,266.00],['16×12 mm',50,336.00],
  ],
  trillion: ALP_TTCA,
  triangle: ALP_TTCA,
  cushion: ALP_TTCA,
  asscher: ALP_TTCA,
  princess: [
    ['1.5 mm',500,2.80],['1.75×1.75 mm',500,3.08],['2×2 mm',500,3.36],['2.25×2.25 mm',500,3.64],['2.5×2.5 mm',500,3.78],
    ['2.75×2.75 mm',500,4.20],['3×3 mm',500,4.48],['3.5×3.5 mm',500,5.60],['4×4 mm',500,7.00],['4.5×4.5 mm',200,9.24],
    ['5×5 mm',200,12.32],['5.5×5.5 mm',200,15.40],['6×6 mm',200,18.20],['6.5×6.5 mm',100,19.60],['7×7 mm',100,26.60],
    ['7.5×7.5 mm',100,32.20],['8×8 mm',100,36.40],['9×9 mm',100,56.00],['10×10 mm',100,70.00],
  ],
  'octagon-princess': [
    ['4×3 mm',500,7.00],['5×3 mm',500,8.96],['5×4 mm',200,11.76],['6×4 mm',200,12.60],['7×5 mm',100,16.80],
    ['8×6 mm',100,25.20],['9×7 mm',100,36.40],['10×8 mm',100,50.40],['11×9 mm',100,78.40],
  ],
  heart: [
    ['3×3 mm',500,7.56],['4×4 mm',200,9.80],['5×5 mm',100,14.00],['6×6 mm',100,21.00],['7×7 mm',100,26.60],
    ['8×8 mm',100,36.40],['9×9 mm',50,56.00],
  ],
};
function alpGreenSizes(shape) { return (ALP_GREEN[shape] || []).map((r) => r[0]); }
function alpGreenSku(shape, size) {
  const row = (ALP_GREEN[shape] || []).find((r) => r[0] === size);
  if (!row) return null;
  return { id: 'alp-green-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.alpGreenSizes = alpGreenSizes;
window.alpGreenSku = alpGreenSku;

// Alp Blue (Alpanite) price sheet — box-sold, from ALP_BLUE.xlsx / RIVEN_12.05.26.
// Each row: [size, pcs per box, final ₹ per piece]. Applies ONLY to 'blue'.
const ALPB_OVALPEAR = [
    ['2.5×1.5 mm',200,6.6],['3×1.5 mm',200,6.6],['3×2 mm',200,6.38],['3×2.5 mm',200,6.85],['3.5×2 mm',200,12.76],
    ['3.5×2.5 mm',200,10.49],['4×2 mm',200,12.19],['4×3 mm',200,10.96],['4.5×3.5 mm',200,18.7],['5×3 mm',200,13.2],
    ['5×4 mm',200,19.38],['6×4 mm',200,18.7],['7×5 mm',100,28.6],['8×5 mm',100,44.0],['8×6 mm',100,44.0],
    ['9×5 mm',50,79.2],['9×6 mm',50,66.0],['9×7 mm',50,74.8],['10×7 mm',50,92.4],['10×8 mm',50,99.0],
    ['11×6 mm',50,125.4],['11×9 mm',50,143.0],['12×5 mm',25,125.4],['12×6 mm',25,125.4],['12×8 mm',25,143.0],
    ['12×10 mm',25,176.0],['14×10 mm',25,209.0],
];
const ALPB_TRITRI = [
    ['3 mm',200,12.1],['4 mm',200,18.7],['5 mm',100,25.3],['6 mm',100,40.7],['7 mm',50,57.2],
    ['8 mm',50,77.0],['9 mm',50,110.0],['10 mm',25,143.0],
];
const ALP_BLUE = {
  round: [
    ['0.70 mm',1000,1.5],['0.80 mm',1000,0.72],['0.90 mm',1000,0.46],['1 mm',1000,0.46],['1.10 mm',1000,0.53],
    ['1.20 mm',1000,0.62],['1.25 mm',1000,0.77],['1.30 mm',1000,0.79],['1.40 mm',1000,0.91],['1.50 mm',1000,1.09],
    ['1.60 mm',1000,1.2],['1.70 mm',1000,1.37],['1.75 mm',1000,1.58],['1.80 mm',1000,1.82],['1.90 mm',1000,2.05],
    ['2 mm',1000,2.23],['2.10 mm',500,2.42],['2.20 mm',500,3.08],['2.25 mm',500,3.08],['2.30 mm',500,3.63],
    ['2.40 mm',500,3.74],['2.50 mm',500,4.4],['2.60 mm',500,5.06],['2.75 mm',500,4.78],['2.80 mm',500,6.33],
    ['2.90 mm',500,6.38],['3 mm',500,6.49],['3.25 mm',200,6.6],['3.50 mm',200,9.46],['3.75 mm',200,11.44],
    ['4 mm',200,14.3],['4.25 mm',200,15.4],['4.50 mm',200,16.06],['4.75 mm',200,19.8],['5 mm',100,23.1],
    ['5.25 mm',100,27.5],['5.50 mm',100,29.7],['5.75 mm',100,33.0],['6 mm',100,36.96],['6.50 mm',100,48.4],
    ['7 mm',100,49.28],['7.50 mm',100,66.0],['8 mm',50,77.0],['9 mm',50,121.0],['10 mm',25,149.6],
    ['11 mm',25,176.0],['12 mm',25,209.0],
  ],
  star: [
    ['3 mm',200,14.3],['4 mm',200,18.7],['5 mm',100,29.7],['6 mm',100,44.0],['7 mm',50,61.6],
    ['8 mm',50,85.8],
  ],
  cushion: [
    ['3 mm',200,11.0],['4 mm',200,16.5],['5 mm',100,25.3],['6 mm',100,40.7],['7 mm',50,57.2],
    ['8 mm',50,77.0],['9 mm',50,110.0],['10 mm',25,143.0],
  ],
  marquise: [
    ['3×1.5 mm',200,5.39],['3×2 mm',200,6.6],['3.5×2 mm',200,8.87],['4×2 mm',200,7.04],['4.5×2.5 mm',200,11.0],
    ['5×2.5 mm',200,10.78],['6×3 mm',100,14.52],['7×3.5 mm',100,20.9],['8×4 mm',100,33.0],['9×4.5 mm',50,46.32],
    ['10×5 mm',50,48.4],['12×6 mm',25,92.4],['14×7 mm',25,143.0],
  ],
  princess: [
    ['1.50 mm',200,3.19],['1.75 mm',200,3.08],['2 mm',200,3.63],['2.25 mm',200,4.84],['2.50 mm',200,5.28],
    ['2.75 mm',200,6.38],['3 mm',200,7.04],['3.25 mm',200,7.92],['3.50 mm',200,8.8],['4 mm',200,13.2],
    ['4.50 mm',200,19.36],['5 mm',100,23.1],['5.50 mm',100,27.5],['6 mm',100,38.5],['6.50 mm',100,48.4],
    ['7 mm',50,58.3],['8 mm',50,74.8],['9 mm',50,114.4],['10 mm',25,149.6],
  ],
  asscher: [
    ['3 mm',200,14.3],['4 mm',200,18.7],['5 mm',100,27.5],['6 mm',100,46.2],['7 mm',50,66.0],
    ['8 mm',50,99.0],['9 mm',50,132.0],['10 mm',25,154.0],
  ],
  'octagon-step': [
    ['3×2 mm',200,7.7],['4×2 mm',200,13.2],['4×3 mm',200,10.34],['5×3 mm',200,13.2],['5×4 mm',200,18.7],
    ['6×4 mm',100,20.9],['7×5 mm',100,34.1],['8×6 mm',50,49.72],['9×7 mm',50,74.8],['10×8 mm',25,121.0],
    ['11×9 mm',25,165.0],['12×10 mm',15,121.0],['12×8 mm',15,187.0],['16×12 mm',15,366.67],
  ],
  'octagon-princess': [
    ['4×3 mm',200,11.0],['5×3 mm',200,14.3],['6×4 mm',100,20.9],['7×5 mm',100,34.1],['8×6 mm',50,55.0],
    ['9×7 mm',50,77.0],['10×8 mm',25,99.0],
  ],
  heart: [
    ['3×3 mm',200,11.0],['4×4 mm',200,16.06],['5×5 mm',100,26.4],['6×6 mm',100,40.7],['7×7 mm',50,60.5],
    ['8×8 mm',50,85.8],['9×9 mm',50,116.6],['10×10 mm',25,143.0],
  ],
  tapered: [
    ['1.1×1×0.8 mm',200,5.28],['1.2×1×0.8 mm',200,5.28],['1.3×1×0.8 mm',200,5.28],['1.4×1×0.8 mm',200,5.28],['1.5×1×0.8 mm',200,5.28],
    ['1.6×1×0.8 mm',200,5.28],['1.7×1×0.8 mm',200,5.28],['1.8×1×0.8 mm',200,5.28],['1.9×1×0.8 mm',200,5.28],['2×1×0.8 mm',200,5.28],
    ['2.1×1×0.8 mm',200,5.28],['2.1×1.2×1 mm',200,5.28],['2.1×1.5×1 mm',200,5.28],['2.2×1×0.8 mm',200,5.28],['2.2×1.2×1 mm',200,5.28],
    ['2.2×1.5×1 mm',200,5.28],['2.25×1.25×1 mm',200,6.06],['2.3×1×0.8 mm',200,5.28],['2.3×1.5×1 mm',200,5.28],['2.4×1×0.8 mm',200,5.28],
    ['2.4×1.2×1 mm',200,5.28],['2.4×1.5×1 mm',200,5.28],['2.5×1×0.8 mm',200,5.28],['2.5×1.2×1 mm',200,5.28],['2.5×1.5×1 mm',200,5.28],
    ['2.5×2×1 mm',200,5.59],['2.5×2×1.5 mm',200,6.52],['2.6×1.5×1 mm',200,5.28],['2.7×1.5×1 mm',200,5.28],['2.8×1.5×1 mm',200,5.28],
    ['2.9×1.5×1 mm',200,5.28],['3×1.5×1 mm',200,5.28],['3×2×1.5 mm',200,5.59],['3.25×1.5×1 mm',200,5.9],['3.25×2×1.5 mm',200,6.39],
    ['3.25×2.5×1.5 mm',200,6.39],['3.5×2×1.5 mm',200,6.39],['3.5×2.5×1.5 mm',200,6.39],['3.75×2×1.5 mm',200,7.38],['3.75×2.5×1.5 mm',200,8.61],
    ['4×2×1 mm',200,5.76],['4×2×1.5 mm',200,5.76],['4×2.5×1.5 mm',200,7.7],['4.5×2.5×1.5 mm',200,12.1],['5×3×1 mm',100,12.1],
    ['5×3×2 mm',100,13.2],['6×3×2 mm',100,16.5],
  ],
  'baguette-step': [
    ['1.1×0.8 mm',200,4.4],['1.2×0.8 mm',200,4.4],['1.3×0.8 mm',200,4.4],['1.4×0.8 mm',200,4.4],['1.5×0.8 mm',200,4.4],
    ['1.6×0.8 mm',200,3.96],['1.7×0.8 mm',200,3.96],['1.8×0.8 mm',200,3.96],['1.9×0.8 mm',200,3.96],['2×0.8 mm',200,3.96],
    ['2×1 mm',200,3.96],['2×1.5 mm',200,3.96],['2.1×1.25 mm',200,4.4],['2.2×1.25 mm',200,4.4],['2.3×1.25 mm',200,4.4],
    ['2.4×1.25 mm',200,4.4],['2.5×1.25 mm',200,4.4],['2.7×1.25 mm',200,4.4],['2.8×1.25 mm',200,4.4],['2.9×1.25 mm',200,4.4],
    ['2.1×1.5 mm',200,4.4],['2.2×1.5 mm',200,4.4],['2.3×1.5 mm',200,4.4],['2.4×1.5 mm',200,4.4],['2.5×1.5 mm',200,4.4],
    ['2.6×1.5 mm',200,4.4],['2.7×1.5 mm',200,4.4],['2.8×1.5 mm',200,4.4],['2.9×1.5 mm',200,4.4],['3×1.5 mm',200,4.4],
    ['3×2 mm',200,4.62],['3×2.5 mm',200,5.5],['3.25×1.5 mm',200,5.5],['3.5×1.5 mm',200,5.5],['3.5×1.75 mm',200,5.5],
    ['3.5×2 mm',200,5.7],['4×1 mm',200,5.5],['4×2 mm',200,5.5],['4×2.5 mm',200,9.9],['4×3 mm',200,10.56],
    ['4.5×2.5 mm',200,11.44],['4.5×3 mm',200,10.56],['5×2.5 mm',200,10.56],['4×3.5 mm',200,10.56],['5×3 mm',100,13.2],
    ['6×3 mm',100,13.73],['6×4 mm',100,20.9],['7×5 mm',100,34.1],['8×4 mm',50,55.0],['8×5 mm',50,55.0],
    ['8×6 mm',50,34.1],
  ],
  oval: ALPB_OVALPEAR,
  pear: ALPB_OVALPEAR,
  triangle: ALPB_TRITRI,
  trillion: ALPB_TRITRI,
};
function alpBlueSizes(shape) { return (ALP_BLUE[shape] || []).map((r) => r[0]); }
function alpBlueSku(shape, size) {
  const row = (ALP_BLUE[shape] || []).find((r) => r[0] === size);
  if (!row) return null;
  return { id: 'alp-blue-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.alpBlueSizes = alpBlueSizes;
window.alpBlueSku = alpBlueSku;

// Alpanite per-colour round price sheets (from the price chart image).
// Each row: [size, pcs per box, ₹ per piece]. pcs filled from the standard
// round MOQ ladder (1000 ≤2.00, 500 ≤3.00, 200 ≤4.75, 100 at 5.00).
const ALP_EXTRA_SHEETS = {
  yellow: { round: [
    ['0.80 mm',1000,0.42],['0.90 mm',1000,0.42],['1.00 mm',1000,0.2],['1.10 mm',1000,0.23],['1.20 mm',1000,0.29],
    ['1.30 mm',1000,0.35],['1.40 mm',1000,0.4],['1.50 mm',1000,0.47],['1.60 mm',1000,0.55],['1.70 mm',1000,0.68],
    ['1.80 mm',1000,0.83],['1.90 mm',1000,0.93],['2.00 mm',1000,1.01],['2.10 mm',500,2.14],['2.20 mm',500,2.14],
    ['2.30 mm',500,2.27],['2.40 mm',500,2.39],['2.50 mm',500,2.88],['2.60 mm',500,3.02],['2.70 mm',500,3.15],
    ['2.80 mm',500,3.79],['2.90 mm',500,3.79],['3.00 mm',500,4.0],['3.25 mm',200,5.3],['3.50 mm',200,5.8],
    ['3.75 mm',200,8.0],['4.00 mm',200,8.5],['4.25 mm',200,10.4],['4.50 mm',200,11.2],['4.75 mm',200,14.4],
    ['5.00 mm',100,16.5],
  ] },
  alp162: { round: [
    ['0.80 mm',1000,0.9],['0.90 mm',1000,0.86],['1.00 mm',1000,0.71],['1.10 mm',1000,1.11],['1.20 mm',1000,1.11],
    ['1.30 mm',1000,1.11],['1.40 mm',1000,1.34],['1.50 mm',1000,1.49],['1.60 mm',1000,1.71],['1.70 mm',1000,2.12],
    ['1.80 mm',1000,2.39],['1.90 mm',1000,2.9],['2.00 mm',1000,3.15],['2.10 mm',500,3.25],['2.25 mm',500,4.2],
    ['2.50 mm',500,5.6],['2.75 mm',500,6.58],['3.00 mm',500,8.26],['3.25 mm',200,9.8],['3.50 mm',200,12.04],
    ['3.75 mm',200,14.84],['4.00 mm',200,18.2],
  ] },
  'alp-aqua': {
    round: [
      ['0.90 mm',1000,0.42],['1.00 mm',1000,0.44],['1.10 mm',1000,0.51],['1.20 mm',1000,0.61],['1.25 mm',1000,0.72],
      ['1.30 mm',1000,0.72],['1.40 mm',1000,0.89],['1.50 mm',1000,0.99],['1.60 mm',1000,1.2],['1.70 mm',1000,1.31],
      ['1.75 mm',1000,1.55],['1.80 mm',1000,1.55],['1.90 mm',1000,1.68],['2.00 mm',1000,1.92],['2.10 mm',500,2.16],
      ['2.25 mm',500,2.99],['2.50 mm',500,3.6],['2.75 mm',500,4.59],['3.00 mm',500,5.51],
    ],
    oval: [
      ['2×3 mm',1,5.28],['2.5×3 mm',1,6.72],['3×4 mm',1,10.08],['3×5 mm',1,11.28],['4×5 mm',1,16.8],
      ['4×6 mm',1,18.0],['5×7 mm',1,24.2],['6×8 mm',1,37.4],['7×9 mm',1,61.6],['8×10 mm',1,72.6],
    ],
    pear: [
      ['2×3 mm',1,5.28],['2.5×3 mm',1,6.72],['3×4 mm',1,10.08],['3×5 mm',1,11.28],['4×5 mm',1,16.8],
      ['4×6 mm',1,18.0],['5×7 mm',1,24.2],['6×8 mm',1,37.4],['7×9 mm',1,61.6],['8×10 mm',1,72.6],
    ],
    marquise: [
      ['1.5×3 mm',1,5.04],['2×4 mm',1,6.48],['2.5×5 mm',1,10.32],['3×6 mm',1,13.68],['3.5×7 mm',1,18.7],
      ['4×8 mm',1,26.4],['5×10 mm',1,40.7],['6×12 mm',1,72.6],
    ],
    baguette: [
      ['1.5×3 mm',1,3.6],['2×3 mm',1,4.8],['2×4 mm',1,5.52],['2.5×5 mm',1,7.92],['3×5 mm',1,9.6],
      ['3×6 mm',1,12.0],['3.5×7 mm',1,18.7],['4×8 mm',1,25.3],['5×10 mm',1,39.6],['6×12 mm',1,59.4],
    ],
    square: [
      ['1.5×1.5 mm',1,2.88],['1.75×75 mm',1,3.12],['2×2 mm',1,3.6],['2.25×2.25 mm',1,4.8],['2.5×2.5 mm',1,5.52],
      ['3×3 mm',1,6.72],['3.5×3.5 mm',1,8.4],['4×4 mm',1,12.0],['4.5×4.5 mm',1,16.32],['5×5 mm',1,19.2],
      ['5.5×5.5 mm',1,24.0],['6×6 mm',1,30.0],['6.5×6.5 mm',1,33.0],['7×7 mm',1,44.0],['7.5×7.5 mm',1,50.6],
      ['8×8 mm',1,61.6],['8.5×8.5 mm',1,72.6],['9×9 mm',1,92.4],['10×10 mm',1,110.0],
    ],
    'octagon-princess': [
      ['3×4 mm',1,10.08],['3×5 mm',1,12.0],['4×6 mm',1,18.0],['5×7 mm',1,27.5],['6×8 mm',1,44.0],
      ['7×9 mm',1,61.6],['8×10 mm',1,79.2],['9×11 mm',1,105.6],
    ],
    'octagon-step': [
      ['3×4 mm',1,10.8],['3×5 mm',1,12.72],['4×6 mm',1,18.72],['5×7 mm',1,28.6],['6×8 mm',1,46.2],
      ['7×9 mm',1,64.9],['8×10 mm',1,83.6],['9×11 mm',1,110.0],
    ],
    heart: [
      ['3×3 mm',1,7.68],['4×4 mm',1,13.2],['4.5×4.5 mm',1,19.2],['5×5 mm',1,22.8],['5.5×5.5 mm',1,27.6],
      ['6×6 mm',1,33.6],['6.5×6.5 mm',1,37.4],['7×7 mm',1,46.2],['7.5×7.5 mm',1,55.0],['8×8 mm',1,66.0],
      ['8.5×8.5 mm',1,77.0],['9×9 mm',1,88.0],['10×10 mm',1,110.0],
    ],
  },
  'paraiba': {
    round: [
      ['0.90 mm',1000,0.6],['1.00 mm',1000,0.53],['1.10 mm',1000,0.6],['1.20 mm',1000,0.72],['1.25 mm',1000,0.77],
      ['1.30 mm',1000,0.91],['1.40 mm',1000,1.03],['1.50 mm',1000,1.15],['1.60 mm',1000,1.44],['1.70 mm',1000,1.68],
      ['1.75 mm',1000,1.92],['1.80 mm',1000,2.16],['1.90 mm',1000,2.28],['2.00 mm',1000,2.4],['2.10 mm',500,2.88],
      ['2.25 mm',500,3.84],['2.50 mm',500,4.8],['2.75 mm',500,6.48],['3.00 mm',500,7.2],['3.25 mm',200,7.92],
      ['3.50 mm',200,10.8],['3.75 mm',200,12.0],['4.00 mm',200,15.6],['4.25 mm',200,16.8],['4.50 mm',200,20.4],
      ['4.75 mm',200,21.6],['5.00 mm',100,24.0],['5.25 mm',100,28.8],['5.50 mm',100,30.0],['5.75 mm',100,34.8],
      ['6.00 mm',100,38.4],['6.25 mm',100,39.6],['6.50 mm',100,44.0],['7.00 mm',100,48.4],['7.50 mm',100,61.6],
    ],
    oval: [
      ['2×3 mm',1,6.24],['2.5×3 mm',1,7.68],['3×4 mm',1,11.04],['3×5 mm',1,13.2],['4×5 mm',1,20.4],
      ['4×6 mm',1,21.6],['5×7 mm',1,30.8],['6×8 mm',1,46.2],['7×9 mm',1,72.6],['8×10 mm',1,85.8],
    ],
    pear: [
      ['2×3 mm',1,6.24],['2.5×3 mm',1,7.68],['3×4 mm',1,11.04],['3×5 mm',1,13.2],['4×5 mm',1,20.4],
      ['4×6 mm',1,21.6],['5×7 mm',1,30.8],['6×8 mm',1,46.2],['7×9 mm',1,72.6],['8×10 mm',1,85.8],
    ],
    marquise: [
      ['1.5×3 mm',1,5.52],['2×4 mm',1,7.68],['2.5×5 mm',1,11.52],['3×6 mm',1,15.6],['3.5×7 mm',1,20.9],
      ['4×8 mm',1,29.7],['5×10 mm',1,48.4],['6×12 mm',1,85.8],
    ],
    baguette: [
      ['1.5×3 mm',1,3.84],['2×3 mm',1,5.04],['2×4 mm',1,6.0],['2.5×5 mm',1,9.12],['3×5 mm',1,11.28],
      ['3×6 mm',1,14.4],['3.5×7 mm',1,23.1],['4×8 mm',1,30.8],['5×10 mm',1,50.6],['6×12 mm',1,70.4],
    ],
    square: [
      ['1.5×1.5 mm',1,3.12],['1.75×75 mm',1,3.36],['2×2 mm',1,4.8],['2.25×2.25 mm',1,5.52],['2.5×2.5 mm',1,6.0],
      ['3×3 mm',1,7.68],['3.5×3.5 mm',1,9.6],['4×4 mm',1,14.4],['4.5×4.5 mm',1,18.72],['5×5 mm',1,22.8],
      ['5.5×5.5 mm',1,28.8],['6×6 mm',1,36.0],['6.5×6.5 mm',1,39.6],['7×7 mm',1,53.9],['7.5×7.5 mm',1,61.6],
      ['8×8 mm',1,74.8],['8.5×8.5 mm',1,92.4],['9×9 mm',1,103.4],['10×10 mm',1,132.0],
    ],
    'octagon-princess': [
      ['3×4 mm',1,11.04],['3×5 mm',1,13.92],['4×6 mm',1,20.88],['5×7 mm',1,31.9],['6×8 mm',1,50.6],
      ['7×9 mm',1,72.6],['8×10 mm',1,94.6],['9×11 mm',1,116.6],
    ],
    'octagon-step': [
      ['3×4 mm',1,11.52],['3×5 mm',1,14.4],['4×6 mm',1,21.6],['5×7 mm',1,33.0],['6×8 mm',1,55.0],
      ['7×9 mm',1,77.0],['8×10 mm',1,99.0],['9×11 mm',1,121.0],
    ],
    heart: [
      ['3×3 mm',1,9.6],['4×4 mm',1,15.6],['4.5×4.5 mm',1,22.8],['5×5 mm',1,26.4],['5.5×5.5 mm',1,32.4],
      ['6×6 mm',1,42.0],['6.5×6.5 mm',1,50.6],['7×7 mm',1,57.2],['7.5×7.5 mm',1,66.0],['8×8 mm',1,81.4],
      ['8.5×8.5 mm',1,92.4],['9×9 mm',1,105.6],['10×10 mm',1,136.4],
    ],
    asscher: [
      ['4 mm',1,18.36],['5 mm',1,27.0],['6 mm',1,45.36],['7 mm',1,59.4],
    ],
  },
  'alp-brown': { round: [
    ['1.00 mm',1000,0.67],['1.10 mm',1000,0.71],['1.20 mm',1000,1.05],['1.30 mm',1000,1.05],['1.40 mm',1000,1.26],
    ['1.50 mm',1000,1.4],['1.60 mm',1000,1.62],['1.70 mm',1000,2.0],['1.80 mm',1000,2.26],['1.90 mm',1000,2.74],
    ['2.00 mm',1000,2.98],
  ] },
  // Rows: [size, pcs per box, ₹/piece, grams per 1000 pc]. The 4th value is the
  // real weight from the price sheet (shown in the pad's Wt/1000 pcs column).
  'yz-green': { round: [
    ['1.00 mm',1000,1.05,1.60],['1.10 mm',1000,1.13,2.20],['1.20 mm',1000,1.46,2.50],['1.30 mm',1000,1.86,3.10],['1.40 mm',1000,2.51,3.70],
    ['1.50 mm',1000,3.0,4.80],['1.60 mm',1000,3.4,5.80],['1.70 mm',1000,3.73,6.50],['1.75 mm',1000,4.05,7.40],['1.80 mm',1000,4.7,8.80],
    ['1.90 mm',1000,5.18,9.30],['2.00 mm',1000,5.83,10.80],
  ] },
  blue113: {
    'round': [['0.80 mm',1000,0.2],['0.90 mm',1000,0.2],['1.00 mm',1000,0.05],['1.10 mm',1000,0.05],['1.20 mm',1000,0.06],['1.30 mm',1000,0.06],['1.40 mm',1000,0.07],['1.50 mm',1000,0.07],['1.60 mm',1000,0.09],['1.70 mm',1000,0.11],['1.80 mm',1000,0.12],['1.90 mm',1000,0.14],['2.00 mm',1000,0.16],['2.25 mm',1000,0.26],['2.30 mm',1000,0.4],['2.40 mm',1000,0.42],['2.50 mm',1000,0.28],['2.70 mm',1000,0.76],['2.75 mm',1000,0.38],['2.90 mm',1000,0.8],['3.00 mm',1000,0.48],['3.25 mm',1000,0.56],['3.50 mm',1000,0.7],['4.00 mm',1000,0.9],['4.25 mm',500,1.1],['4.50 mm',500,1.52],['4.75 mm',500,1.66],['5.00 mm',500,1.84],['5.25 mm',500,2.6],['5.50 mm',500,2.6],['5.75 mm',500,3.6],['6.00 mm',500,3.4],['6.25 mm',200,9],['6.50 mm',200,5.8],['6.75 mm',200,9.6],['7.00 mm',200,6.4],['7.50 mm',200,9.6],['8.00 mm',200,11],['9.00 mm',200,17.4]],
    'oval': [['3×2 mm',1000,0.42],['3×2.5 mm',1000,0.56],['4×3 mm',1000,0.84],['4.5×3.5 mm',200,2.6],['5×3 mm',1000,0.96],['5×4 mm',1000,2.22],['6×4 mm',1000,1.84],['7×5 mm',1000,2.6],['8×5 mm',1000,11.67],['8×6 mm',500,13.72],['9×6 mm',200,17.5],['9×7 mm',500,19],['10×8 mm',500,19.85],['11×9 mm',200,44],['12×10 mm',500,60],['12×8 mm',200,38],['14×10 mm',200,90]],
    'pear': [['3×2 mm',1000,0.42],['3×2.5 mm',1000,0.56],['4×3 mm',1000,0.84],['4.5×3.5 mm',200,2.6],['5×3 mm',1000,0.96],['5×4 mm',1000,2.22],['6×4 mm',1000,1.84],['7×5 mm',1000,2.6],['8×5 mm',1000,11.67],['8×6 mm',500,13.72],['9×6 mm',200,17.5],['9×7 mm',500,19],['10×8 mm',500,19.85],['11×9 mm',200,44],['12×10 mm',500,60],['12×8 mm',200,38],['14×10 mm',200,90]],
    'marquise': [['3×1.5 mm',500,0.42],['4×2 mm',500,0.46],['5×2.5 mm',500,0.86],['6×3 mm',500,1.3],['7×3.5 mm',500,2.4],['8×4 mm',500,3.4],['10×5 mm',500,7],['9×4.5 mm',200,22],['12×6 mm',200,17]],
    'princess': [['2 mm',1000,0.3],['2.25 mm',1000,0.6],['2.5 mm',1000,0.46],['2.75 mm',1000,0.7],['3 mm',1000,0.6],['3.5 mm',1000,1.04],['4 mm',1000,1.04],['4.5 mm',1000,1.9],['5 mm',1000,1.9],['6 mm',1000,3.6],['7 mm',500,12],['8 mm',500,14],['9 mm',500,34],['10 mm',500,36]],
    'cushion': [['3 mm',500,6],['4 mm',500,5],['5 mm',500,5.2],['6 mm',500,9.6],['7 mm',500,16],['8 mm',500,32],['9 mm',500,46],['10 mm',200,70]],
    'asscher': [['3 mm',200,5.37],['3.5 mm',200,7.77],['4 mm',200,8.63],['4.5 mm',200,13.28],['5 mm',200,14.59],['5.5 mm',100,21.23],['6 mm',100,22.4],['6.5 mm',100,25.5],['7 mm',50,28.8],['7.5 mm',50,35.68],['8 mm',50,38.4],['9 mm',50,57.71],['10 mm',50,67.17]],
    'triangle': [['3 mm',500,3.6],['4 mm',500,5],['5 mm',500,8.4],['6 mm',500,13],['7 mm',200,16.53],['8 mm',200,26]],
    'heart': [['3 mm',500,1.08],['4 mm',500,1.6],['5 mm',500,2.7],['6 mm',500,4.6],['7 mm',500,10],['8 mm',200,15.6],['9 mm',200,32],['10 mm',200,36]],
    'baguette-step': [['1.5×1 mm',500,0.74],['1.75×1 mm',500,0.5],['2×1 mm',500,0.52],['2×1.5 mm',500,0.52],['2.5×1.5 mm',500,0.52],['2.75×1.5 mm',500,1.39],['3×1.5 mm',500,0.54],['3.5×1.5 mm',500,1.11],['2.5×2 mm',500,0.8],['3×2 mm',500,0.62],['3.5×2 mm',200,0.68],['4×2 mm',200,0.68],['5×2.5 mm',200,1.25],['2.25×1.5 mm',200,1.39],['5×3 mm',200,2.2],['6×3 mm',200,2.39],['6×4 mm',200,3.61]],
    'octagon-step': [['3×5 mm',500,1.8],['5×7 mm',500,7],['6×8 mm',500,12],['7×9 mm',500,22]],
  },
  blue114: {
    'round': [['0.80 mm',1000,0.2],['0.90 mm',1000,0.2],['1.00 mm',1000,0.05],['1.10 mm',1000,0.05],['1.20 mm',1000,0.06],['1.30 mm',1000,0.06],['1.40 mm',1000,0.07],['1.50 mm',1000,0.07],['1.60 mm',1000,0.09],['1.70 mm',1000,0.11],['1.80 mm',1000,0.12],['1.90 mm',1000,0.14],['2.00 mm',1000,0.16],['2.25 mm',1000,0.26],['2.30 mm',1000,0.4],['2.40 mm',1000,0.42],['2.50 mm',1000,0.28],['2.70 mm',1000,0.76],['2.75 mm',1000,0.38],['2.90 mm',1000,0.8],['3.00 mm',1000,0.48],['3.25 mm',1000,0.56],['3.50 mm',1000,0.7],['4.00 mm',1000,0.9],['4.25 mm',500,1.1],['4.50 mm',500,1.52],['4.75 mm',500,1.66],['5.00 mm',500,1.84],['5.25 mm',500,2.6],['5.50 mm',500,2.6],['5.75 mm',500,3.6],['6.00 mm',500,3.4],['6.25 mm',200,9],['6.50 mm',200,5.8],['6.75 mm',200,9.6],['7.00 mm',200,6.4],['7.50 mm',200,9.6],['8.00 mm',200,11],['9.00 mm',200,17.4]],
    'oval': [['3×2 mm',1000,0.42],['3×2.5 mm',1000,0.56],['4×3 mm',1000,0.84],['4.5×3.5 mm',200,2.6],['5×3 mm',1000,0.96],['5×4 mm',1000,2.22],['6×4 mm',1000,1.84],['7×5 mm',1000,2.6],['8×5 mm',1000,11.67],['8×6 mm',500,13.72],['9×6 mm',200,17.5],['9×7 mm',500,19],['10×8 mm',500,19.85],['11×9 mm',200,44],['12×10 mm',500,60],['12×8 mm',200,38],['14×10 mm',200,90]],
    'pear': [['3×2 mm',1000,0.42],['3×2.5 mm',1000,0.56],['4×3 mm',1000,0.84],['4.5×3.5 mm',200,2.6],['5×3 mm',1000,0.96],['5×4 mm',1000,2.22],['6×4 mm',1000,1.84],['7×5 mm',1000,2.6],['8×5 mm',1000,11.67],['8×6 mm',500,13.72],['9×6 mm',200,17.5],['9×7 mm',500,19],['10×8 mm',500,19.85],['11×9 mm',200,44],['12×10 mm',500,60],['12×8 mm',200,38],['14×10 mm',200,90]],
    'marquise': [['3×1.5 mm',500,0.42],['4×2 mm',500,0.46],['5×2.5 mm',500,0.86],['6×3 mm',500,1.3],['7×3.5 mm',500,2.4],['8×4 mm',500,3.4],['10×5 mm',500,7],['9×4.5 mm',200,22],['12×6 mm',200,17]],
    'princess': [['2 mm',1000,0.3],['2.25 mm',1000,0.6],['2.5 mm',1000,0.46],['2.75 mm',1000,0.7],['3 mm',1000,0.6],['3.5 mm',1000,1.04],['4 mm',1000,1.04],['4.5 mm',1000,1.9],['5 mm',1000,1.9],['6 mm',1000,3.6],['7 mm',500,12],['8 mm',500,14],['9 mm',500,34],['10 mm',500,36]],
    'cushion': [['3 mm',500,6],['4 mm',500,5],['5 mm',500,5.2],['6 mm',500,9.6],['7 mm',500,16],['8 mm',500,32],['9 mm',500,46],['10 mm',200,70]],
    'asscher': [['3 mm',200,5.37],['3.5 mm',200,7.77],['4 mm',200,8.63],['4.5 mm',200,13.28],['5 mm',200,14.59],['5.5 mm',100,21.23],['6 mm',100,22.4],['6.5 mm',100,25.5],['7 mm',50,28.8],['7.5 mm',50,35.68],['8 mm',50,38.4],['9 mm',50,57.71],['10 mm',50,67.17]],
    'triangle': [['3 mm',500,3.6],['4 mm',500,5],['5 mm',500,8.4],['6 mm',500,13],['7 mm',200,16.53],['8 mm',200,26]],
    'heart': [['3 mm',500,1.08],['4 mm',500,1.6],['5 mm',500,2.7],['6 mm',500,4.6],['7 mm',500,10],['8 mm',200,15.6],['9 mm',200,32],['10 mm',200,36]],
    'baguette-step': [['1.5×1 mm',500,0.74],['1.75×1 mm',500,0.5],['2×1 mm',500,0.52],['2×1.5 mm',500,0.52],['2.5×1.5 mm',500,0.52],['2.75×1.5 mm',500,1.39],['3×1.5 mm',500,0.54],['3.5×1.5 mm',500,1.11],['2.5×2 mm',500,0.8],['3×2 mm',500,0.62],['3.5×2 mm',200,0.68],['4×2 mm',200,0.68],['5×2.5 mm',200,1.25],['2.25×1.5 mm',200,1.39],['5×3 mm',200,2.2],['6×3 mm',200,2.39],['6×4 mm',200,3.61]],
    'octagon-step': [['3×5 mm',500,1.8],['5×7 mm',500,7],['6×8 mm',500,12],['7×9 mm',500,22]],
  },
};
function alpSheetSizes(colorId, shape) {
  const s = ALP_EXTRA_SHEETS[colorId];
  return s && s[shape] ? s[shape].map((r) => r[0]) : [];
}
function alpSheetSku(colorId, shape, size) {
  const s = ALP_EXTRA_SHEETS[colorId];
  const row = s && s[shape] ? s[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'alp-' + colorId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row[3] != null ? row[3] : null };
}
// True when this colour+shape's price sheet carries a real weight (grams/1000 pc).
function alpSheetHasWeight(colorId, shape) {
  const s = ALP_EXTRA_SHEETS[colorId];
  return !!(s && s[shape] && s[shape].some((r) => r[3] != null));
}
window.alpSheetSizes = alpSheetSizes;
window.alpSheetSku = alpSheetSku;
window.alpSheetHasWeight = alpSheetHasWeight;

// HD Zirconia (High Density) price + weight sheet — sold by weight.
// Per grade, round only. Row: [size, pcs/box, ₹/piece, grams per 1000 pc].
// Etoile/H/HH share one price; Super Heavy/HHH share another. Super Heavy
// adds half-step sizes; HHH is full-tenths only. From the HD MERCURY sheet.
const HD_MERCURY = {
  etoile: { round: [
    ['1.00 mm',1000,1.42,2.2],['1.10 mm',1000,1.57,2.84],['1.20 mm',1000,1.76,3.76],['1.30 mm',1000,2.1,4.9],['1.40 mm',1000,2.3,5.985],
    ['1.50 mm',1000,2.72,7.0],['1.60 mm',1000,3.1,8.5],['1.70 mm',1000,3.65,9.8],['1.80 mm',1000,4.85,11.4],['1.90 mm',1000,5.65,13.6],
    ['2.00 mm',1000,5.85,18.4],
  ] },
  h: { round: [
    ['1.00 mm',1000,1.42,2.32],['1.10 mm',1000,1.57,3.2],['1.20 mm',1000,1.76,4.0],['1.30 mm',1000,2.1,5.7],['1.40 mm',1000,2.3,6.5],
    ['1.50 mm',1000,2.72,7.4],['1.60 mm',1000,3.1,8.7],['1.70 mm',1000,3.65,11.2],['1.80 mm',1000,4.85,13.6],['1.90 mm',1000,5.65,16.52],
    ['2.00 mm',1000,5.85,18.9],
  ] },
  hh: { round: [
    ['1.00 mm',1000,1.42,2.8],['1.10 mm',1000,1.57,3.6],['1.20 mm',1000,1.76,4.5],['1.30 mm',1000,2.1,5.8],['1.40 mm',1000,2.3,6.85],
    ['1.50 mm',1000,2.72,8.75],['1.60 mm',1000,3.1,10.25],['1.70 mm',1000,3.65,12.3],['1.80 mm',1000,4.85,14.6],['1.90 mm',1000,5.65,17.0],
    ['2.00 mm',1000,5.85,18.9],
  ] },
  superheavy: { round: [
    ['1.00 mm',1000,1.42,4.5],['1.10 mm',1000,1.57,5.2],['1.15 mm',1000,1.65,7.0],['1.20 mm',1000,1.76,5.7],['1.25 mm',1000,1.95,8.65],
    ['1.30 mm',1000,2.1,7.6],['1.35 mm',1000,2.2,10.85],['1.40 mm',1000,2.3,9.4],['1.45 mm',1000,2.52,13.25],['1.50 mm',1000,2.72,11.5],
    ['1.55 mm',1000,2.92,16.35],['1.60 mm',1000,3.1,16.0],['1.70 mm',1000,3.65,17.4],['1.80 mm',1000,4.85,18.4],['1.90 mm',1000,5.65,21.2],
    ['2.00 mm',1000,5.85,24.3],
  ] },
  hhh: { round: [
    ['1.00 mm',1000,1.42,4.8],['1.10 mm',1000,1.57,6.4],['1.20 mm',1000,1.76,7.6],['1.30 mm',1000,2.1,9.7],['1.40 mm',1000,2.3,12.0],
    ['1.50 mm',1000,2.72,14.5],['1.60 mm',1000,3.1,18.2],['1.70 mm',1000,3.65,21.4],['1.80 mm',1000,4.85,26.6],['1.90 mm',1000,5.65,31.0],
    ['2.00 mm',1000,5.85,35.0],
  ] },
};
function hdSizes(gradeId, shape) {
  const g = HD_MERCURY[gradeId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function hdSku(gradeId, shape, size) {
  const g = HD_MERCURY[gradeId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'hd-' + gradeId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row[3] != null ? row[3] : null };
}
function hdHasWeight(gradeId, shape) {
  const g = HD_MERCURY[gradeId];
  return !!(g && g[shape] && g[shape].some((r) => r[3] != null));
}
window.hdSizes = hdSizes;
window.hdSku = hdSku;
window.hdHasWeight = hdHasWeight;

// Corundum EXCEL AAA · Ruby 5 (VGI) price sheet — RIVEN tab. Priced PER PIECE
// (pcs=1). Keyed 'grade|colour' = 'aaa|ruby5'. Row: [size, pcs, ₹/piece].
const CORUNDUM_SHEETS = {
  'aaa|ruby5': {
    round: [
      ['0.80 mm',1,0.98],['0.90 mm',1,0.84],['1.00 mm',1,0.84],['1.10 mm',1,0.84],['1.20 mm',1,0.98],
      ['1.30 mm',1,1.12],['1.40 mm',1,1.26],['1.50 mm',1,1.4],['1.60 mm',1,1.6],['1.70 mm',1,1.74],
      ['1.80 mm',1,1.9],['1.90 mm',1,2.24],['2.00 mm',1,2.24],['2.10 mm',1,3.22],['2.20 mm',1,3.92],
      ['2.30 mm',1,4.2],['2.40 mm',1,4.76],['2.50 mm',1,4.9],['2.60 mm',1,5.88],['2.70 mm',1,6.44],
      ['2.80 mm',1,7.56],['2.90 mm',1,8.12],['3.00 mm',1,8.12],['3.25 mm',1,9.8],['3.50 mm',1,11.2],
      ['3.75 mm',1,12.04],['4.00 mm',1,13.44],['4.25 mm',1,15.4],['4.50 mm',1,16.24],['4.75 mm',1,21.0],
      ['5.00 mm',1,23.24],['5.25 mm',1,28.0],['5.50 mm',1,30.8],['5.75 mm',1,32.2],['6.00 mm',1,33.6],
      ['6.50 mm',1,43.4],['7.00 mm',1,50.4],['7.50 mm',1,58.8],['8.00 mm',1,70.0],
    ],
    oval: [
      ['3×2 mm',1,13.48],['3×2.5 mm',1,13.57],['4×3 mm',1,13.48],['4.5×3.5 mm',1,24.42],['5×3 mm',1,16.07],
      ['5×4 mm',1,24.42],['6×4 mm',1,24.42],['7×5 mm',1,34.27],['8×5 mm',1,48.44],['8×6 mm',1,48.44],
      ['9×7 mm',1,52.5],['10×8 mm',1,58.8],
    ],
    pear: [
      ['3×2 mm',1,13.48],['3×2.5 mm',1,13.57],['4×3 mm',1,13.48],['4.5×3.5 mm',1,24.42],['5×3 mm',1,16.07],
      ['5×4 mm',1,24.42],['6×4 mm',1,24.42],['7×5 mm',1,34.27],['8×5 mm',1,48.44],['8×6 mm',1,48.44],
      ['9×7 mm',1,52.5],['10×8 mm',1,58.8],
    ],
    marquise: [
      ['3×1.5 mm',1,8.67],['4×2 mm',1,9.81],['5×2.5 mm',1,13.92],['6×3 mm',1,18.77],['7×3.5 mm',1,21.84],
      ['8×4 mm',1,26.22],['9×4.5 mm',1,52.96],
    ],
    princess: [
      ['1.5 mm',1,8.39],['1.75 mm',1,7.0],['2 mm',1,6.93],['2.25 mm',1,7.5],['2.5 mm',1,9.24],
      ['2.75 mm',1,9.45],['3 mm',1,10.12],['3.25 mm',1,17.51],['3.5 mm',1,18.76],['4 mm',1,19.33],
      ['5 mm',1,34.31],['6 mm',1,41.31],['9 mm',1,162.4],
    ],
    'octagon-princess': [
      ['5×3 mm',1,10.12],['6×4 mm',1,20.17],['7×5 mm',1,33.26],['8×6 mm',1,53.37],['10×8 mm',1,131.6],
      ['11×9 mm',1,189.0],
    ],
    heart: [
      ['3 mm',1,10.12],['4 mm',1,21.01],['5 mm',1,27.78],
    ],
  },
  'aaa|blue34': {
    'round': [['0.80 mm',500,6.4],['0.90 mm',500,6.4],['1.00 mm',500,5.2],['1.10 mm',500,5.4],['1.20 mm',500,5.6],['1.30 mm',500,6.4],['1.40 mm',500,6.6],['1.50 mm',500,7.56],['1.60 mm',500,8],['1.70 mm',500,9],['1.80 mm',500,9.6],['1.90 mm',500,10.8],['2.00 mm',500,11],['2.10 mm',200,12],['2.20 mm',200,15.6],['2.25 mm',200,15.6],['2.30 mm',200,17],['2.40 mm',200,18],['2.50 mm',200,19.6],['2.60 mm',200,21.94],['2.75 mm',200,26],['3.00 mm',200,28],['3.25 mm',100,30.22],['3.50 mm',100,40],['3.75 mm',100,41.11],['4.00 mm',100,44],['4.50 mm',100,56.67],['5.00 mm',100,70],['5.50 mm',100,84],['6.00 mm',100,96],['6.25 mm',50,125],['6.50 mm',50,120],['7.00 mm',50,122.78],['7.50 mm',50,151.11],['8.00 mm',25,179.44]],
    'pear': [['3×2 mm',100,33],['3×2.5 mm',100,37.78],['4×3 mm',100,42],['5×3 mm',100,48],['5×4 mm',50,64],['6×4 mm',50,66],['7×5 mm',50,96],['8×6 mm',50,140],['9×7 mm',20,184.44],['10×8 mm',20,221.11],['9×6 mm',20,160]],
    'oval': [['3×2 mm',100,33],['3×2.5 mm',100,37.78],['4×3 mm',100,42],['5×3 mm',100,48],['5×4 mm',50,64],['6×4 mm',50,66],['7×5 mm',50,96],['8×6 mm',50,140],['9×7 mm',20,184.44],['10×8 mm',20,221.11],['9×6 mm',20,160]],
    'princess': [['1.5 mm',200,21],['1.75 mm',200,26],['2 mm',200,25],['2.25 mm',100,30],['2.5 mm',100,32.22],['2.75 mm',100,37.78],['3 mm',100,37.78],['3.25 mm',100,47.22],['3.5 mm',100,47.22],['4 mm',100,58],['4.5 mm',50,90],['5 mm',50,82.22],['6 mm',50,103.89],['7 mm',50,141.67]],
    'heart': [['3 mm',100,31.17],['4 mm',100,49.56],['4.5 mm',50,66.11],['5 mm',50,66.11],['6 mm',50,86.89],['7 mm',25,150],['8 mm',25,166.22],['10 mm',15,320]],
    'marquise': [['1.5×3 mm',100,30],['2×4 mm',100,37],['2.5×5 mm',100,40],['3×6 mm',50,54],['7×3.5 mm',50,66],['8×4 mm',50,90],['10×5 mm',25,165.56]],
    'cushion': [['3 mm',100,32.11],['4 mm',100,49.11],['5 mm',50,71.78],['6 mm',50,86.89],['7 mm',25,135.56],['8 mm',25,166.22],['9 mm',15,280]],
    'baguette': [['2×1 mm',200,24],['2.5×1.5 mm',200,24],['3×1.5 mm',100,35.89],['3×2 mm',100,35.89],['4×2 mm',100,36],['5×2.5 mm',100,55],['6×3 mm',50,76],['6×4 mm',50,93.33]],
    'octagon-step': [['4×3 mm',100,50.4],['5×3 mm',100,70],['5×4 mm',50,100],['6×4 mm',50,90],['7×5 mm',50,130],['8×6 mm',50,170],['9×7 mm',25,210],['10×8 mm',25,330],['11×9 mm',15,360],['12×10 mm',15,420]],
    'trillion': [['3 mm',100,40],['4 mm',100,72],['5 mm',50,90],['6 mm',50,108],['7 mm',25,153],['8 mm',25,207],['9 mm',15,297],['10 mm',15,378]],
    'octagon-princess': [['4×3 mm',100,72],['5×3 mm',100,56],['6×4 mm',50,80],['7×5 mm',50,104],['8×6 mm',50,154],['9×7 mm',25,200],['10×8 mm',25,270],['11×9 mm',15,300],['12×10 mm',15,400]],
  },
  'aa|ruby8': {
    'baguette': [['1.1×0.8 mm',1,5.94],['1.2×0.8 mm',1,5.94],['1.3×0.8 mm',1,5.94],['1.4×0.8 mm',1,5.94],['1.5×0.8 mm',1,5.94],['1.5×1 mm',1,5.06],['1.6×0.8 mm',1,5.94],['1.6×1 mm',1,5.06],['1.7×0.8 mm',1,5.94],['1.7×1 mm',1,5.06],['1.8×0.8 mm',1,5.94],['1.8×1 mm',1,5.06],['1.8×1.5 mm',1,5.06],['1.9×0.8 mm',1,5.94],['1.9×1 mm',1,5.06],['2×0.8 mm',1,5.94],['2×1 mm',1,4.9],['2×1.5 mm',1,5.06],['2.1×1.2 mm',1,6.42],['2.2×1.2 mm',1,6.42],['2.2×1.25 mm',1,4.84],['2.25×1.25 mm',1,5.81],['2.3×1.2 mm',1,6.42],['2.4×1.2 mm',1,6.42],['2.5×1.2 mm',1,6.42],['2.5×1.25 mm',1,5.06],['2.5×1.5 mm',1,5.61],['2.6×1.5 mm',1,5.61],['2.7×1.5 mm',1,5.61],['2.75×1.5 mm',1,5.81],['2.8×1.5 mm',1,5.61],['2.9×1.5 mm',1,5.61],['3×1 mm',1,6.42],['3×1.5 mm',1,5.61],['3×2 mm',1,7.27],['3.25×1.5 mm',1,8.36],['3.25×2 mm',1,9.9],['3.5×1.5 mm',1,7.27],['3.5×2 mm',1,8.36],['3.5×2.5 mm',1,12.1],['3.75×1.5 mm',1,8.36],['4×1.5 mm',1,8.36],['4×2 mm',1,7.27],['4×2.5 mm',1,13.2],['4×3 mm',1,21.39],['4.5×2 mm',1,9.9],['4.5×2.5 mm',1,12.77],['5×2.5 mm',1,13.2],['5×3 mm',1,14.3],['6×3 mm',1,22.8],['8×4 mm',1,22.8]],
    'princess': [['1.5 mm',1,4.84],['1.75 mm',1,5.06],['2 mm',1,4.16],['2.25 mm',1,5.82],['2.5 mm',1,8.14],['2.75 mm',1,8.36],['3 mm',1,8.36],['3.25 mm',1,11.43],['3.5 mm',1,16.21],['4 mm',1,19.36],['4.5 mm',1,29.39],['5 mm',1,32.41],['5.5 mm',1,39.89],['6 mm',1,52.92],['7 mm',1,74.8],['8 mm',1,85.8],['9 mm',1,135.67]],
    'octagon-step': [['3×2 mm',1,9.9],['4×2 mm',1,11],['4×3 mm',1,20.78],['5×3 mm',1,24],['5×4 mm',1,38.88],['6×4 mm',1,32.27],['7×5 mm',1,51.33],['8×6 mm',1,69.67],['9×7 mm',1,110],['10×8 mm',1,143],['11×9 mm',1,209],['12×10 mm',1,201.67],['16×12 mm',1,385],['12×8 mm',1,162.56]],
    'round': [['0.70 mm',1,1.01],['0.80 mm',1,0.72],['0.90 mm',1,0.56],['1.00 mm',1,0.42],['1.10 mm',1,0.48],['1.20 mm',1,0.55],['1.30 mm',1,0.66],['1.40 mm',1,0.76],['1.50 mm',1,0.84],['1.60 mm',1,1],['1.70 mm',1,1.12],['1.80 mm',1,1.38],['1.90 mm',1,1.54],['2.00 mm',1,1.68],['2.10 mm',1,2.1],['2.20 mm',1,2.92],['2.30 mm',1,3],['2.40 mm',1,3.31],['2.50 mm',1,3.29],['2.60 mm',1,3.96],['2.70 mm',1,4.7],['2.80 mm',1,5.33],['2.90 mm',1,5.51],['3.00 mm',1,5.8],['3.10 mm',1,6.91],['3.25 mm',1,8.28],['3.50 mm',1,10.36],['3.75 mm',1,12.42],['4.00 mm',1,15.53],['4.25 mm',1,17.5],['4.50 mm',1,21.42],['4.75 mm',1,25.34],['5.00 mm',1,28.87],['5.25 mm',1,31.5],['5.50 mm',1,36.7],['5.75 mm',1,42],['6.00 mm',1,45.95],['6.25 mm',1,45.95],['6.50 mm',1,52.97],['6.75 mm',1,48.68],['7.00 mm',1,52.47],['7.50 mm',1,74.8],['8.00 mm',1,82.5],['9.00 mm',1,126.5],['10.00 mm',1,198]],
    'heart': [['3 mm',1,10.2],['3.5 mm',1,17.04],['4 mm',1,17.04],['5 mm',1,26.4],['6 mm',1,41.56],['7 mm',1,56.22],['8 mm',1,88],['10 mm',1,143.73]],
    'marquise': [['3×1.5 mm',1,6.34],['3×2 mm',1,7.04],['4×2 mm',1,5.82],['4.5×2.5 mm',1,15.89],['5×2.5 mm',1,9.97],['6×3 mm',1,18.36],['7×3.5 mm',1,25.97],['8×4 mm',1,33.24],['9×4.5 mm',1,72.6],['10×5 mm',1,66],['12×6 mm',1,117.33],['14×7 mm',1,156.44]],
    'cushion': [['3 mm',1,16.5],['3.5 mm',1,22],['4 mm',1,21.6],['5 mm',1,30.8],['6 mm',1,46.2],['7 mm',1,70.4],['8 mm',1,92.4],['9 mm',1,165],['10 mm',1,209]],
    'oval': [['2.5×1.5 mm',1,6.6],['3×2 mm',1,7.06],['3×2.5 mm',1,7.9],['3.5×2.5 mm',1,13.2],['4×2.5 mm',1,15.33],['4×3 mm',1,10.56],['4.5×2.5 mm',1,15.4],['5×3 mm',1,13.2],['5×4 mm',1,25.3],['6×4 mm',1,24.84],['7×5 mm',1,40.27],['8×6 mm',1,47.67],['9×5 mm',1,116.11],['9×6 mm',1,72.11],['9×7 mm',1,75.78],['10×8 mm',1,107.07],['11×6 mm',1,174.78],['11×7 mm',1,144.22],['11×9 mm',1,135.67],['12×10 mm',1,256.67],['12×5 mm',1,174.78],['12×6 mm',1,174.78],['12×8 mm',1,132],['14×10 mm',1,319],['14×9 mm',1,268.89]],
    'pear': [['2.5×1.5 mm',1,6.6],['3×2 mm',1,7.06],['3×2.5 mm',1,7.9],['3.5×2.5 mm',1,13.2],['4×2.5 mm',1,15.33],['4×3 mm',1,10.56],['4.5×2.5 mm',1,15.4],['5×3 mm',1,13.2],['5×4 mm',1,25.3],['6×4 mm',1,24.84],['7×5 mm',1,40.27],['8×6 mm',1,47.67],['9×5 mm',1,116.11],['9×6 mm',1,72.11],['9×7 mm',1,75.78],['10×8 mm',1,107.07],['11×6 mm',1,174.78],['11×7 mm',1,144.22],['11×9 mm',1,135.67],['12×10 mm',1,256.67],['12×5 mm',1,174.78],['12×6 mm',1,174.78],['12×8 mm',1,132],['14×10 mm',1,319],['14×9 mm',1,268.89]],
    'star': [['3 mm',1,11],['4 mm',1,17.6],['5 mm',1,25.52],['6 mm',1,42.24],['7 mm',1,92.4],['8 mm',1,121]],
    'octagon-princess': [['8×6 mm',1,83.11]],
    'triangle': [['3 mm',1,12.47],['4 mm',1,20.37],['5 mm',1,31.17],['6 mm',1,43.63],['7 mm',1,56.1],['8 mm',1,121],['9 mm',1,156.32],['10 mm',1,229.9]],
    'trillion': [['3 mm',1,13.2],['4 mm',1,32.08],['5 mm',1,47.06],['6 mm',1,66.31],['7 mm',1,96.25],['8 mm',1,117.64],['9 mm',1,149.72],['10 mm',1,198.92]],
    'asscher': [['3 mm',1,23.1],['4 mm',1,19.14],['5 mm',1,33],['6 mm',1,44],['7 mm',1,83.11],['8 mm',1,99],['9 mm',1,189.44]],
  },
  'aa|ruby5': {
    'round': [['0.70 mm',1,1.05],['0.80 mm',1,0.2],['0.90 mm',1,0.2],['1.00 mm',1,0.25],['1.10 mm',1,0.25],['1.20 mm',1,0.31],['1.30 mm',1,0.31],['1.40 mm',1,0.35],['1.50 mm',1,0.4],['1.60 mm',1,0.42],['1.70 mm',1,0.52],['1.80 mm',1,0.63],['1.90 mm',1,0.67],['2.00 mm',1,0.76],['2.10 mm',1,0.83],['2.20 mm',1,1.11],['2.25 mm',1,1.08],['2.30 mm',1,1.21],['2.40 mm',1,1.39],['2.50 mm',1,1.38],['2.60 mm',1,1.71],['2.70 mm',1,1.69],['2.75 mm',1,1.79],['2.80 mm',1,1.98],['2.90 mm',1,1.87],['3.00 mm',1,2.16],['3.10 mm',1,2.34],['3.20 mm',1,2.45],['3.25 mm',1,2.75],['3.30 mm',1,2.86],['3.40 mm',1,4.19],['3.50 mm',1,3.19],['3.60 mm',1,3.48],['3.70 mm',1,3.96],['3.75 mm',1,3.88],['3.80 mm',1,4.33],['3.90 mm',1,4.33],['4.00 mm',1,3.97],['4.25 mm',1,5.3],['4.50 mm',1,6.12],['4.75 mm',1,7.7],['5.00 mm',1,8.46],['5.25 mm',1,10.12],['5.50 mm',1,12.85],['5.75 mm',1,12.85],['6.00 mm',1,13.46],['6.25 mm',1,17.16],['6.50 mm',1,19.36],['6.75 mm',1,26.84],['7.00 mm',1,21.78],['7.25 mm',1,39.6],['7.50 mm',1,31.16],['7.75 mm',1,46.2],['8.00 mm',1,37.4],['8.25 mm',1,56.1],['8.50 mm',1,45.71],['8.75 mm',1,61.6],['9.00 mm',1,51.95],['9.50 mm',1,72.72],['10.00 mm',1,66],['10.50 mm',1,80.66],['11.00 mm',1,95.34],['11.50 mm',1,99.74],['12.00 mm',1,99.74],['13.00 mm',1,193.11],['14.00 mm',1,231],['15.00 mm',1,196.78],['16.00 mm',1,308],['18.00 mm',1,374]],
    'marquise': [['3×2 mm',1,2.7],['3×1.5 mm',1,2],['3.5×2 mm',1,4.66],['4×2 mm',1,2],['4.5×2.5 mm',1,3.67],['5×2.5 mm',1,3.08],['6×3 mm',1,4.62],['7×3.5 mm',1,8.36],['8×4 mm',1,12.1],['9×4.5 mm',1,26.4],['10×5 mm',1,26.4],['12×6 mm',1,57.2],['14×7 mm',1,72.6]],
    'baguette': [['1.1×0.8 mm',1,2.15],['1.2×0.8 mm',1,1.66],['1.3×0.8 mm',1,1.66],['1.4×0.8 mm',1,1.66],['1.5×0.8 mm',1,1.66],['1.6×0.8 mm',1,1.66],['1.7×0.8 mm',1,1.66],['1.8×0.8 mm',1,1.66],['1.9×0.8 mm',1,2.33],['2×0.8 mm',1,2.33],['1.5×1 mm',1,2.33],['2×1 mm',1,2.33],['2.5×1 mm',1,2.33],['1.5×1.25 mm',1,2.33],['2×1.25 mm',1,2.33],['2.1×1.25 mm',1,2.33],['2.25×1.25 mm',1,2.33],['2.3×1.25 mm',1,2.33],['2.4×1.25 mm',1,2.33],['2.5×1.25 mm',1,2.33],['2.6×1.25 mm',1,2.33],['2.7×1.25 mm',1,2.33],['2.8×1.25 mm',1,2.33],['2.9×1.25 mm',1,2.33],['2×1.5 mm',1,2.33],['2.1×1.5 mm',1,2.33],['2.25×1.5 mm',1,2.33],['2.3×1.5 mm',1,2.33],['2.4×1.5 mm',1,2.33],['2.5×1.5 mm',1,2.33],['2.6×1.5 mm',1,2.33],['2.75×1.5 mm',1,2.33],['2.8×1.5 mm',1,2.33],['2.9×1.5 mm',1,2.33],['3×1.5 mm',1,2.33],['3.25×1.5 mm',1,2.09],['3.5×1.5 mm',1,2.33],['3.5×1.75 mm',1,2.46],['3×2 mm',1,2.33],['3.5×2 mm',1,2.33],['3.75×2 mm',1,2.33],['4×2 mm',1,1.93],['3×2.5 mm',1,2.76],['4×2.5 mm',1,3.96],['4.5×2.5 mm',1,5.8],['5×2.5 mm',1,5.8],['4×3 mm',1,5.8],['4.5×3 mm',1,5.8],['5×3 mm',1,9.46],['6×3 mm',1,13.2],['4×3.5 mm',1,5.8],['6×4 mm',1,16.5],['7×5 mm',1,28.6],['8×4 mm',1,55],['9×7 mm',1,61.6]],
    'oval': [['2×1.5 mm',1,5.5],['2.5×1.5 mm',1,5.5],['3×2 mm',1,2],['3×2.5 mm',1,2.64],['3.5×2.5 mm',1,2.83],['4×2 mm',1,5.5],['4×3 mm',1,2.42],['4.5×3.5 mm',1,4.18],['5×3 mm',1,3.3],['5×4 mm',1,6.6],['5.5×4.5 mm',1,6.6],['6×4 mm',1,6.94],['7×5 mm',1,11.66],['8×5 mm',1,19.55],['8×6 mm',1,17.6],['9×6 mm',1,37.4],['9×7 mm',1,25.3],['10×7 mm',1,55],['10×8 mm',1,52.8],['11×8 mm',1,77],['11×9 mm',1,77],['12×8 mm',1,90.2],['12×9 mm',1,142.35],['12×10 mm',1,94.6],['16×12 mm',1,165],['14×10 mm',1,110],['14×12 mm',1,171.6],['15×11 mm',1,193.11],['18×13 mm',1,232.22]],
    'pear': [['2×1.5 mm',1,5.5],['2.5×1.5 mm',1,5.5],['3×2 mm',1,2],['3×2.5 mm',1,2.64],['3.5×2.5 mm',1,2.83],['4×2 mm',1,5.5],['4×3 mm',1,2.42],['4.5×3.5 mm',1,4.18],['5×3 mm',1,3.3],['5×4 mm',1,6.6],['5.5×4.5 mm',1,6.6],['6×4 mm',1,6.94],['7×5 mm',1,11.66],['8×5 mm',1,19.55],['8×6 mm',1,17.6],['9×6 mm',1,37.4],['9×7 mm',1,25.3],['10×7 mm',1,55],['10×8 mm',1,52.8],['11×8 mm',1,77],['11×9 mm',1,77],['12×8 mm',1,90.2],['12×9 mm',1,142.35],['12×10 mm',1,94.6],['16×12 mm',1,165],['14×10 mm',1,110],['14×12 mm',1,171.6],['15×11 mm',1,193.11],['18×13 mm',1,232.22]],
    'octagon-princess': [['3×2 mm',1,5.5],['4×2 mm',1,6.16],['4×3 mm',1,8.8],['5×4 mm',1,13.2],['5×3 mm',1,13.2],['6×4 mm',1,17.6],['7×5 mm',1,33],['8×6 mm',1,28.11],['9×7 mm',1,55],['10×8 mm',1,68.2],['11×9 mm',1,88],['12×10 mm',1,110],['14×10 mm',1,127.6],['15×10 mm',1,141.29],['16×12 mm',1,127.6]],
    'princess': [['1.5 mm',1,2],['1.75 mm',1,2],['2 mm',1,2],['2.25 mm',1,2],['2.5 mm',1,2.2],['2.75 mm',1,2.2],['3 mm',1,2.42],['3.25 mm',1,4.4],['3.5 mm',1,4.84],['3.75 mm',1,5.94],['4 mm',1,5.06],['4.5 mm',1,9.46],['4.75 mm',1,9.96],['5 mm',1,11],['5.5 mm',1,20.51],['6 mm',1,19.36],['6.5 mm',1,35.2],['7 mm',1,39.6],['7.5 mm',1,47.79],['8 mm',1,48.4],['8.5 mm',1,60.5],['9 mm',1,49.87],['10 mm',1,72.72],['11 mm',1,103.89],['12 mm',1,132],['13 mm',1,275],['14 mm',1,297]],
    'heart': [['2.5 mm',1,7.21],['3 mm',1,4.08],['3.5 mm',1,9.46],['4 mm',1,6.38],['5 mm',1,11.88],['6 mm',1,18.7],['6.5 mm',1,34.94],['7 mm',1,33],['7.5 mm',1,57.2],['8 mm',1,48.4],['9 mm',1,70.4],['10 mm',1,77],['11 mm',1,127.6],['12 mm',1,149.6],['13 mm',1,198],['14 mm',1,253],['15 mm',1,297]],
    'triangle': [['3 mm',1,8.8],['3.5 mm',1,7.7],['4 mm',1,8.8],['5 mm',1,16.62],['6 mm',1,29.34],['7 mm',1,37.89],['8 mm',1,66],['9 mm',1,149.11],['10 mm',1,165]],
    'star': [['3 mm',1,8.67],['4 mm',1,12.1],['5 mm',1,18.16],['6 mm',1,28.6],['7 mm',1,46.38],['8 mm',1,38.5],['9 mm',1,72.87],['10 mm',1,77.14]],
    'asscher': [['3 mm',1,11],['4 mm',1,12.1],['5 mm',1,20.9],['6 mm',1,35.2],['7 mm',1,70.4],['8 mm',1,92.4],['9 mm',1,127.11],['10 mm',1,165]],
    'cushion': [['2 mm',1,5.5],['2.5 mm',1,6.16],['3 mm',1,9.72],['4 mm',1,13.59],['5 mm',1,18.7],['6 mm',1,28.6],['7 mm',1,39.6],['8 mm',1,53.78],['9 mm',1,61.11],['10 mm',1,88],['11 mm',1,145.44],['12 mm',1,198],['13 mm',1,198],['15 mm',1,286]],
    'octagon-step': [['3×2 mm',1,5.5],['4×2 mm',1,5.5],['4×3 mm',1,8.8],['5×3 mm',1,10.56],['5×4 mm',1,14.3],['6×4 mm',1,17.6],['7×5 mm',1,28.6],['8×6 mm',1,39.6],['9×7 mm',1,62.34],['10×8 mm',1,83.6],['11×9 mm',1,149.6],['12×10 mm',1,187],['12×9 mm',1,211.45],['14×10 mm',1,264]],
  },
  'aa|ruby2': {
    'princess': [['1.5 mm',1,4.3],['1.75 mm',1,4.3],['2 mm',1,4.3],['2.25 mm',1,4.34],['2.5 mm',1,4.48],['2.75 mm',1,6.37],['3 mm',1,7],['3.25 mm',1,9.66],['3.5 mm',1,11.2],['4 mm',1,12.6],['4.5 mm',1,13.86],['5 mm',1,25.2],['5.5 mm',1,21.42],['6 mm',1,40.32],['7 mm',1,55.44],['8 mm',1,80.64],['9 mm',1,113.4]],
    'marquise': [['3×1.5 mm',1,4.55],['3×2 mm',1,6.3],['4×2 mm',1,5.04],['5×2.5 mm',1,7.56],['6×3 mm',1,12.04],['7×3.5 mm',1,20.16],['8×4 mm',1,28],['9×4.5 mm',1,47.6],['10×5 mm',1,50.4],['12×6 mm',1,72.8],['14×7 mm',1,106.4]],
    'oval': [['3×2 mm',1,4.48],['3.5×2.5 mm',1,10.08],['3×2.5 mm',1,8.33],['4×3 mm',1,8.68],['4.5×3.5 mm',1,16.38],['4×2.5 mm',1,16.38],['5×3 mm',1,10.08],['5×4 mm',1,15.4],['6×4 mm',1,16.63],['6×5 mm',1,32.76],['7×5 mm',1,26.46],['8×5 mm',1,32.76],['8×6 mm',1,37.8],['9×7 mm',1,56],['10×7 mm',1,64.4],['10×8 mm',1,75.6],['11×7 mm',1,99.4],['12×8 mm',1,103.6],['14×10 mm',1,163.8],['11×9 mm',1,103.6],['12×10 mm',1,134.4],['9×6 mm',1,47.6]],
    'pear': [['3×2 mm',1,4.48],['3.5×2.5 mm',1,10.08],['3×2.5 mm',1,8.33],['4×3 mm',1,8.68],['4.5×3.5 mm',1,16.38],['4×2.5 mm',1,16.38],['5×3 mm',1,10.08],['5×4 mm',1,15.4],['6×4 mm',1,16.63],['6×5 mm',1,32.76],['7×5 mm',1,26.46],['8×5 mm',1,32.76],['8×6 mm',1,37.8],['9×7 mm',1,56],['10×7 mm',1,64.4],['10×8 mm',1,75.6],['11×7 mm',1,99.4],['12×8 mm',1,103.6],['14×10 mm',1,163.8],['11×9 mm',1,103.6],['12×10 mm',1,134.4],['9×6 mm',1,47.6]],
    'asscher': [['3 mm',1,11.34],['4 mm',1,21.92],['5 mm',1,37.8],['6 mm',1,50.4],['7 mm',1,80.64],['8 mm',1,113.4],['9 mm',1,130.9],['10 mm',1,226.8]],
    'octagon-step': [['3×2 mm',1,12.1],['4×2 mm',1,7.56],['4×3 mm',1,16.38],['5×3 mm',1,11.34],['5×4 mm',1,19.6],['6×4 mm',1,23.94],['7×5 mm',1,42.84],['8×6 mm',1,64.82],['9×7 mm',1,84],['10×8 mm',1,106.4],['11×9 mm',1,172.8],['12×9 mm',1,207.36],['12×10 mm',1,183.6],['14×10 mm',1,237.6]],
    'octagon-princess': [['3×2 mm',1,12.1],['4×2 mm',1,7.56],['4×3 mm',1,16.38],['5×3 mm',1,11.34],['5×4 mm',1,19.6],['6×4 mm',1,23.94],['7×5 mm',1,42.84],['8×6 mm',1,64.82],['9×7 mm',1,84],['10×8 mm',1,106.4],['11×9 mm',1,172.8],['12×9 mm',1,207.36],['12×10 mm',1,183.6],['14×10 mm',1,237.6]],
    'triangle': [['3 mm',1,13.44],['4 mm',1,16.8],['5 mm',1,36.4],['6 mm',1,56],['7 mm',1,84],['8 mm',1,109.2],['9 mm',1,139.2],['10 mm',1,168]],
    'star': [['3 mm',1,12.6],['4 mm',1,20.16],['5 mm',1,29.23],['6 mm',1,48.38],['7 mm',1,90.72],['8 mm',1,118.8]],
    'cushion': [['2 mm',1,7.56],['3 mm',1,10.64],['4 mm',1,14.28],['5 mm',1,21],['6 mm',1,30.94],['7 mm',1,45.22],['8 mm',1,64.26],['9 mm',1,124.74],['10 mm',1,130.9]],
    'heart': [['3 mm',1,9.45],['3.5 mm',1,11.2],['4 mm',1,13.61],['5 mm',1,21.42],['6 mm',1,33.6],['7 mm',1,43.89],['8 mm',1,60],['9 mm',1,148.32],['10 mm',1,180]],
    'trillion': [['3 mm',1,12.04],['4 mm',1,18.2],['5 mm',1,28],['6 mm',1,44.8],['7 mm',1,64.4],['8 mm',1,92.4],['9 mm',1,120],['10 mm',1,151.2]],
    'round': [['0.70 mm',1,1.13],['0.80 mm',1,0.5],['0.90 mm',1,0.42],['1.00 mm',1,0.36],['1.10 mm',1,0.45],['1.20 mm',1,0.53],['1.30 mm',1,0.6],['1.40 mm',1,0.66],['1.50 mm',1,0.73],['1.60 mm',1,0.81],['1.70 mm',1,0.9],['1.80 mm',1,1.01],['1.90 mm',1,1.13],['2.00 mm',1,1.21],['2.10 mm',1,1.74],['2.20 mm',1,1.85],['2.25 mm',1,1.89],['2.30 mm',1,2.18],['2.40 mm',1,2.52],['2.50 mm',1,2.66],['2.60 mm',1,3.08],['2.75 mm',1,3.02],['2.80 mm',1,3.15],['2.90 mm',1,3.53],['3.00 mm',1,4.79],['3.25 mm',1,4.79],['3.50 mm',1,5.8],['3.75 mm',1,7.06],['4.00 mm',1,8.82],['4.50 mm',1,13.36],['5.00 mm',1,15.88],['5.50 mm',1,20.16],['6.00 mm',1,23.94],['6.50 mm',1,30.24],['7.00 mm',1,37.8],['7.50 mm',1,44.1],['8.00 mm',1,50.4],['9.00 mm',1,69.6]],
    'baguette': [['3×1.5 mm',1,3.36],['1.5×1 mm',1,3.28],['2×1 mm',1,3.28],['2×1.5 mm',1,3.36],['2.5×1.5 mm',1,3.28],['3×2 mm',1,5.04],['3.5×1.5 mm',1,3.53],['4×2 mm',1,5.04],['4.5×2 mm',1,8.82],['5×2.5 mm',1,9.8],['5×3 mm',1,12.6],['6×3 mm',1,17.64]],
    'tapered': [['3×2×1.5 mm',1,4.2],['4×2×1.5 mm',1,4.54]],
  },
  'aa|ruby3': {
    'princess': [['1.5 mm',1,4.3],['1.75 mm',1,4.3],['2 mm',1,4.3],['2.25 mm',1,4.34],['2.5 mm',1,4.48],['2.75 mm',1,6.37],['3 mm',1,7],['3.25 mm',1,9.66],['3.5 mm',1,11.2],['4 mm',1,12.6],['4.5 mm',1,13.86],['5 mm',1,25.2],['5.5 mm',1,21.42],['6 mm',1,40.32],['7 mm',1,55.44],['8 mm',1,80.64],['9 mm',1,113.4]],
    'marquise': [['3×1.5 mm',1,4.55],['3×2 mm',1,6.3],['4×2 mm',1,5.04],['5×2.5 mm',1,7.56],['6×3 mm',1,12.04],['7×3.5 mm',1,20.16],['8×4 mm',1,28],['9×4.5 mm',1,47.6],['10×5 mm',1,50.4],['12×6 mm',1,72.8],['14×7 mm',1,106.4]],
    'oval': [['3×2 mm',1,4.48],['3.5×2.5 mm',1,10.08],['3×2.5 mm',1,8.33],['4×3 mm',1,8.68],['4.5×3.5 mm',1,16.38],['4×2.5 mm',1,16.38],['5×3 mm',1,10.08],['5×4 mm',1,15.4],['6×4 mm',1,16.63],['6×5 mm',1,32.76],['7×5 mm',1,26.46],['8×5 mm',1,32.76],['8×6 mm',1,37.8],['9×7 mm',1,56],['10×7 mm',1,64.4],['10×8 mm',1,75.6],['11×7 mm',1,99.4],['12×8 mm',1,103.6],['14×10 mm',1,163.8],['11×9 mm',1,103.6],['12×10 mm',1,134.4],['9×6 mm',1,47.6]],
    'pear': [['3×2 mm',1,4.48],['3.5×2.5 mm',1,10.08],['3×2.5 mm',1,8.33],['4×3 mm',1,8.68],['4.5×3.5 mm',1,16.38],['4×2.5 mm',1,16.38],['5×3 mm',1,10.08],['5×4 mm',1,15.4],['6×4 mm',1,16.63],['6×5 mm',1,32.76],['7×5 mm',1,26.46],['8×5 mm',1,32.76],['8×6 mm',1,37.8],['9×7 mm',1,56],['10×7 mm',1,64.4],['10×8 mm',1,75.6],['11×7 mm',1,99.4],['12×8 mm',1,103.6],['14×10 mm',1,163.8],['11×9 mm',1,103.6],['12×10 mm',1,134.4],['9×6 mm',1,47.6]],
    'asscher': [['3 mm',1,11.34],['4 mm',1,21.92],['5 mm',1,37.8],['6 mm',1,50.4],['7 mm',1,80.64],['8 mm',1,113.4],['9 mm',1,130.9],['10 mm',1,226.8]],
    'octagon-step': [['3×2 mm',1,12.1],['4×2 mm',1,7.56],['4×3 mm',1,16.38],['5×3 mm',1,11.34],['5×4 mm',1,19.6],['6×4 mm',1,23.94],['7×5 mm',1,42.84],['8×6 mm',1,64.82],['9×7 mm',1,84],['10×8 mm',1,106.4],['11×9 mm',1,172.8],['12×9 mm',1,207.36],['12×10 mm',1,183.6],['14×10 mm',1,237.6]],
    'octagon-princess': [['3×2 mm',1,12.1],['4×2 mm',1,7.56],['4×3 mm',1,16.38],['5×3 mm',1,11.34],['5×4 mm',1,19.6],['6×4 mm',1,23.94],['7×5 mm',1,42.84],['8×6 mm',1,64.82],['9×7 mm',1,84],['10×8 mm',1,106.4],['11×9 mm',1,172.8],['12×9 mm',1,207.36],['12×10 mm',1,183.6],['14×10 mm',1,237.6]],
    'triangle': [['3 mm',1,13.44],['4 mm',1,16.8],['5 mm',1,36.4],['6 mm',1,56],['7 mm',1,84],['8 mm',1,109.2],['9 mm',1,139.2],['10 mm',1,168]],
    'star': [['3 mm',1,12.6],['4 mm',1,20.16],['5 mm',1,29.23],['6 mm',1,48.38],['7 mm',1,90.72],['8 mm',1,118.8]],
    'cushion': [['2 mm',1,7.56],['3 mm',1,10.64],['4 mm',1,14.28],['5 mm',1,21],['6 mm',1,30.94],['7 mm',1,45.22],['8 mm',1,64.26],['9 mm',1,124.74],['10 mm',1,130.9]],
    'heart': [['3 mm',1,9.45],['3.5 mm',1,11.2],['4 mm',1,13.61],['5 mm',1,21.42],['6 mm',1,33.6],['7 mm',1,43.89],['8 mm',1,60],['9 mm',1,148.32],['10 mm',1,180]],
    'trillion': [['3 mm',1,12.04],['4 mm',1,18.2],['5 mm',1,28],['6 mm',1,44.8],['7 mm',1,64.4],['8 mm',1,92.4],['9 mm',1,120],['10 mm',1,151.2]],
    'round': [['0.70 mm',1,1.13],['0.80 mm',1,0.5],['0.90 mm',1,0.42],['1.00 mm',1,0.36],['1.10 mm',1,0.45],['1.20 mm',1,0.53],['1.30 mm',1,0.6],['1.40 mm',1,0.66],['1.50 mm',1,0.73],['1.60 mm',1,0.81],['1.70 mm',1,0.9],['1.80 mm',1,1.01],['1.90 mm',1,1.13],['2.00 mm',1,1.21],['2.10 mm',1,1.74],['2.20 mm',1,1.85],['2.25 mm',1,1.89],['2.30 mm',1,2.18],['2.40 mm',1,2.52],['2.50 mm',1,2.66],['2.60 mm',1,3.08],['2.75 mm',1,3.02],['2.80 mm',1,3.15],['2.90 mm',1,3.53],['3.00 mm',1,4.79],['3.25 mm',1,4.79],['3.50 mm',1,5.8],['3.75 mm',1,7.06],['4.00 mm',1,8.82],['4.50 mm',1,13.36],['5.00 mm',1,15.88],['5.50 mm',1,20.16],['6.00 mm',1,23.94],['6.50 mm',1,30.24],['7.00 mm',1,37.8],['7.50 mm',1,44.1],['8.00 mm',1,50.4],['9.00 mm',1,69.6]],
    'baguette': [['3×1.5 mm',1,3.36],['1.5×1 mm',1,3.28],['2×1 mm',1,3.28],['2×1.5 mm',1,3.36],['2.5×1.5 mm',1,3.28],['3×2 mm',1,5.04],['3.5×1.5 mm',1,3.53],['4×2 mm',1,5.04],['4.5×2 mm',1,8.82],['5×2.5 mm',1,9.8],['5×3 mm',1,12.6],['6×3 mm',1,17.64]],
    'tapered': [['3×2×1.5 mm',1,4.2],['4×2×1.5 mm',1,4.54]],
  },
};
function corSizes(gradeId, colorId, shape) {
  const g = CORUNDUM_SHEETS[gradeId + '|' + colorId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function corSku(gradeId, colorId, shape, size) {
  const g = CORUNDUM_SHEETS[gradeId + '|' + colorId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'cor-' + gradeId + '-' + colorId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.corSizes = corSizes;
window.corSku = corSku;

// White Fancy Shapes (Zirconia) per-grade price sheets — box-sold, from the
// 'riven' tabs of the grade files. Row: [size, pcs/box, ₹/piece]. Standard
// shapes only; specialty cuts in the sheets are not wired yet (need shape icons).
const WHITEFANCY_SHEETS = {
  leplus: {
    round: [
      ['4.00 mm',200,7.37],['4.25 mm',200,8.38],['4.50 mm',200,9.42],['4.75 mm',100,10.32],['5.00 mm',100,11.38],
      ['5.25 mm',100,12.69],['5.50 mm',100,13.78],['5.75 mm',100,14.66],['6.00 mm',100,15.09],['6.25 mm',100,17.72],
      ['6.50 mm',100,18.81],['6.75 mm',100,20.13],['7.00 mm',100,20.56],['7.25 mm',50,22.75],['7.50 mm',50,25.16],
      ['7.75 mm',50,27.78],['8.00 mm',50,30.19],['8.25 mm',50,35.0],['8.50 mm',50,37.19],['8.75 mm',50,40.03],
      ['9.00 mm',50,41.03],['9.25 mm',50,51.01],['9.50 mm',50,52.01],['9.75 mm',25,53.01],['10.00 mm',25,54.69],
      ['10.25 mm',25,66.99],['10.50 mm',25,74.25],['10.75 mm',25,99.0],['11.00 mm',25,104.0],['11.50 mm',25,115.0],
      ['12.00 mm',25,125.0],['12.50 mm',25,145.0],['13.00 mm',15,195.0],['14.00 mm',15,230.0],['15.00 mm',15,270.0],
      ['16.00 mm',15,684.0],
    ],
    oval: [
      ['3×2 mm',200,4.88],['3×2.5 mm',200,6.19],['3.5×2.5 mm',200,6.19],['3.75×2.75 mm',200,6.75],['4×3 mm',200,4.88],
      ['4.25×3.25 mm',200,7.5],['4.5×3.5 mm',200,9.25],['4.75×3.75 mm',200,9.38],['5×3 mm',100,4.91],['5×4 mm',100,7.2],
      ['6×4 mm',100,11.8],['7×5 mm',100,16.92],['8×5 mm',50,29.33],['8×6 mm',50,29.33],['9×6 mm',50,40.99],
      ['9×7 mm',50,40.99],['10×6 mm',50,40.99],['10×7 mm',50,51.75],['10×8 mm',50,51.75],['11×7 mm',25,51.75],
      ['11×8 mm',25,51.75],['11×9 mm',25,52.13],['12×7 mm',25,63.75],['12×8 mm',25,63.75],['12×9 mm',25,63.75],
      ['12×10 mm',25,63.75],['13×9 mm',25,80.64],['13×10 mm',15,80.64],['13×11 mm',15,80.64],['14×7 mm',15,80.64],
      ['14×9 mm',15,80.64],['14×10 mm',15,80.64],['14×11 mm',15,142.31],['14×12 mm',15,142.31],['15×10 mm',15,129.38],
      ['15×11 mm',15,129.38],['15×12 mm',15,129.38],['16×12 mm',15,153.25],['18×13 mm',15,169.25],
    ],
    pear: [
      ['3×2 mm',200,4.88],['3×2.5 mm',200,6.19],['3.5×2.5 mm',200,6.19],['3.75×2.75 mm',200,6.75],['4×3 mm',200,4.88],
      ['4.25×3.25 mm',200,7.5],['4.5×3.5 mm',200,9.25],['4.75×3.75 mm',200,9.38],['5×3 mm',100,4.91],['5×4 mm',100,7.2],
      ['6×4 mm',100,11.8],['7×5 mm',100,16.92],['8×5 mm',50,29.33],['8×6 mm',50,29.33],['9×6 mm',50,40.99],
      ['9×7 mm',50,40.99],['10×6 mm',50,40.99],['10×7 mm',50,51.75],['10×8 mm',50,51.75],['11×7 mm',25,51.75],
      ['11×8 mm',25,51.75],['11×9 mm',25,52.13],['12×7 mm',25,63.75],['12×8 mm',25,63.75],['12×9 mm',25,63.75],
      ['12×10 mm',25,63.75],['13×9 mm',25,80.64],['13×10 mm',15,80.64],['13×11 mm',15,80.64],['14×7 mm',15,80.64],
      ['14×9 mm',15,80.64],['14×10 mm',15,80.64],['14×11 mm',15,142.31],['14×12 mm',15,142.31],['15×10 mm',15,129.38],
      ['15×11 mm',15,129.38],['15×12 mm',15,129.38],['16×12 mm',15,153.25],['18×13 mm',15,169.25],
    ],
    marquise: [
      ['3×1.5 mm',200,3.25],['3×2 mm',200,3.9],['4×2 mm',200,3.45],['5×2.5 mm',200,4.95],['6×3 mm',100,6.49],
      ['7×3.5 mm',100,12.08],['8×4 mm',50,14.66],['9×4.5 mm',50,21.0],['10×5 mm',50,25.01],['12×6 mm',25,36.0],
      ['14×7 mm',25,42.85],['16×8 mm',25,73.44],['13×6.5 mm',25,78.4],
    ],
    princess: [
      ['1 mm',200,7.5],['1.1 mm',200,7.5],['1.2 mm',200,7.5],['1.25 mm',200,7.5],['1.3 mm',200,7.5],
      ['1.4 mm',200,7.5],['1.5 mm',200,3.39],['1.6 mm',200,3.39],['1.7 mm',200,3.39],['1.75 mm',200,3.39],
      ['1.8 mm',200,3.39],['1.9 mm',200,3.39],['2 mm',200,4.14],['2.1 mm',200,4.14],['2.2 mm',200,4.5],
      ['2.25 mm',200,4.5],['2.3 mm',200,4.5],['2.4 mm',200,4.5],['2.5 mm',200,5.11],['2.6 mm',200,5.11],
      ['2.7 mm',200,5.34],['2.75 mm',200,5.34],['2.8 mm',200,5.34],['2.9 mm',200,5.34],['3 mm',200,5.45],
      ['3.2 mm',200,5.63],['3.25 mm',200,5.63],['3.3 mm',200,5.63],['3.4 mm',200,5.63],['3.5 mm',200,6.0],
      ['3.75 mm',200,9.0],['4 mm',200,12.0],['4.25 mm',100,13.09],['4.5 mm',100,15.09],['4.75 mm',100,16.16],
      ['5 mm',100,17.61],['5.25 mm',100,17.96],['5.5 mm',100,18.75],['6 mm',50,21.99],['6.5 mm',50,29.25],
      ['7 mm',50,31.31],['7.5 mm',50,36.75],['8 mm',50,41.4],['8.5 mm',25,51.75],['9 mm',25,54.77],
      ['9.5 mm',25,64.88],['10 mm',25,79.78],['11 mm',15,96.0],['12 mm',15,111.0],
    ],
    cushion: [
      ['3 mm',200,15.51],['3.5 mm',200,16.71],['4 mm',200,18.99],['4.5 mm',100,19.22],['5 mm',100,20.99],
      ['5.5 mm',100,21.25],['6 mm',100,21.99],['6.5 mm',100,25.33],['7 mm',50,31.91],['7.5 mm',50,36.33],
      ['8 mm',50,41.4],['9 mm',25,54.77],['10 mm',25,79.78],['11 mm',15,76.51],['12 mm',15,91.8],
    ],
    'oblong-cushion': [
      ['5×3 mm',100,9.6],['6×4 mm',100,9.6],['7×5 mm',50,16.2],['8×6 mm',50,28.35],['9×7 mm',50,40.25],
      ['10×8 mm',25,56.0],['11×9 mm',25,76.0],['12×10 mm',25,97.0],['12×9 mm',25,91.0],['16×12 mm',25,182.0],
      ['12×8 mm',25,165.2],
    ],
    asscher: [
      ['3 mm',200,11.25],['3.5 mm',200,12.99],['4 mm',200,13.75],['4.5 mm',200,18.66],['5 mm',100,22.12],
      ['5.5 mm',100,26.55],['6 mm',100,28.21],['6.5 mm',100,29.5],['7 mm',50,31.0],['7.5 mm',50,38.99],
      ['8 mm',50,40.0],['9 mm',25,47.0],['10 mm',25,62.0],['11 mm',15,85.62],['12 mm',15,150.1],
    ],
    'octagon-princess': [
      ['3×2 mm',200,10.0],['4×3 mm',200,10.0],['4.5×3.5 mm',200,10.0],['5×3 mm',100,6.38],['5×4 mm',100,10.88],
      ['6×4 mm',100,10.88],['7×5 mm',50,19.84],['8×6 mm',50,32.36],['9×7 mm',50,40.99],['10×6 mm',50,48.75],
      ['10×8 mm',50,56.06],['4×3.5 mm',200,12.25],['11×9 mm',25,67.5],['12×8 mm',25,65.11],['12×9 mm',25,85.5],
      ['12×10 mm',25,109.99],['13×11 mm',15,118.88],['14×10 mm',15,146.63],['14×12 mm',15,146.63],['16×12 mm',15,153.25],
      ['16×14 mm',15,153.25],['10×7 mm',15,48.3],
    ],
    'octagon-step': [
      ['2.5×1.5 mm',200,10.0],['3×2 mm',200,10.0],['3.5×2 mm',100,11.55],['3.5×2.5 mm',200,10.0],['4×3 mm',200,10.0],
      ['4.5×3.5 mm',200,10.0],['5×3 mm',100,5.38],['5×3.5 mm',100,10.0],['5×4 mm',100,10.88],['6×4 mm',100,10.88],
      ['7×5 mm',50,19.84],['8×5 mm',50,49.0],['8×6 mm',50,32.36],['9×6 mm',50,38.33],['9×7 mm',50,40.99],
      ['10×7 mm',50,51.06],['10×8 mm',50,56.06],['11×8 mm',25,66.21],['11×9 mm',25,67.5],['12×10 mm',25,109.99],
      ['12×7 mm',15,64.0],['12×8 mm',25,69.66],['12×9 mm',25,91.22],['13×10 mm',15,124.0],['13×11 mm',15,118.88],
      ['13×9 mm',15,110.0],['14×10 mm',15,146.63],['14×12 mm',15,146.63],['15×10 mm',15,164.0],['16×12 mm',15,153.25],
      ['16×14 mm',15,153.25],['18×11 mm',15,255.0],['18×13 mm',15,229.0],['4×2 mm',100,10.0],
    ],
    'curved-trillion': [
      ['2 mm',200,5.63],['2.5 mm',200,6.56],['2.7 mm',200,6.56],['3 mm',200,8.45],['3.5 mm',200,9.25],
      ['4 mm',200,9.38],['4.5 mm',100,15.25],['5 mm',100,18.46],['6 mm',100,21.45],['7 mm',100,33.42],
      ['8 mm',50,37.95],['9 mm',50,52.36],['10 mm',50,75.9],['11 mm',25,103.25],['12 mm',25,132.11],
    ],
    heart: [
      ['2 mm',200,7.5],['2.5 mm',200,7.5],['3 mm',200,7.5],['3.5 mm',200,7.5],['4 mm',200,9.38],
      ['4.5 mm',200,10.51],['5 mm',100,13.13],['5.5 mm',100,18.19],['6 mm',100,24.39],['6.5 mm',100,28.22],
      ['7 mm',50,30.0],['7.5 mm',50,30.5],['8 mm',50,31.25],['9 mm',25,42.0],['10 mm',25,60.75],
      ['11 mm',15,83.12],['12 mm',15,91.8],['13 mm',15,135.0],['14 mm',15,175.0],['15 mm',15,229.0],
      ['16 mm',15,270.0],
    ],
    star: [
      ['3 mm',100,11.4],['4 mm',100,13.61],['4.5 mm',100,14.11],['5 mm',100,16.09],['6 mm',100,21.04],
      ['7 mm',50,29.7],['8 mm',50,35.89],['9 mm',50,64.75],['10 mm',25,86.25],
    ],
  },
  audesus: {
    round: [
      ['4.00 mm',80,6.29],['4.25 mm',80,8.01],['4.50 mm',80,9.74],['5.00 mm',80,13.49],['5.25 mm',60,23.13],
      ['5.50 mm',60,24.38],['5.75 mm',60,25.81],['6.00 mm',60,29.64],['6.25 mm',60,31.39],['6.50 mm',60,32.84],
      ['6.75 mm',35,36.77],['7.00 mm',35,39.74],['7.25 mm',35,43.25],['7.50 mm',35,47.17],['7.75 mm',35,49.26],
      ['8.00 mm',35,52.23],['8.25 mm',15,58.85],['8.50 mm',15,60.92],['8.75 mm',15,72.15],['9.00 mm',15,75.37],
      ['9.25 mm',15,82.59],['9.50 mm',15,87.25],['9.75 mm',15,98.82],['10.00 mm',15,100.14],['10.50 mm',15,110.0],
      ['11.00 mm',15,120.64],['11.50 mm',15,137.5],['12.00 mm',15,201.0],['12.50 mm',15,258.0],['13.00 mm',15,362.5],
      ['14.00 mm',15,437.5],['15.00 mm',15,537.5],
    ],
    oval: [
      ['3×2 mm',100,20.31],['3×2.5 mm',100,28.05],['4×3 mm',100,28.05],['5×3 mm',80,22.53],['5×4 mm',80,39.6],
      ['6×4 mm',70,30.49],['7×5 mm',40,43.38],['8×6 mm',40,57.4],['9×6 mm',15,70.13],['9×7 mm',15,86.63],
      ['10×7 mm',15,107.25],['10×8 mm',15,107.25],['11×8 mm',15,128.29],['11×9 mm',15,146.85],['12×10 mm',15,205.23],
      ['12×8 mm',15,139.84],['13×10 mm',15,233.06],['13×9 mm',15,198.0],['14×10 mm',15,233.06],['14×12 mm',15,274.93],
      ['15×10 mm',15,375.0],['15×11 mm',15,375.0],['15×12 mm',15,375.0],['16×12 mm',15,460.0],['18×12 mm',15,466.13],
      ['18×13 mm',15,466.13],['20×14 mm',15,722.91],
    ],
    pear: [
      ['3×2 mm',100,20.31],['3×2.5 mm',100,28.05],['4×3 mm',100,28.05],['5×3 mm',80,22.53],['5×4 mm',80,39.6],
      ['6×4 mm',70,30.49],['7×5 mm',40,43.38],['8×6 mm',40,57.4],['9×6 mm',15,70.13],['9×7 mm',15,86.63],
      ['10×7 mm',15,107.25],['10×8 mm',15,107.25],['11×8 mm',15,128.29],['11×9 mm',15,146.85],['12×10 mm',15,205.23],
      ['12×8 mm',15,139.84],['13×10 mm',15,233.06],['13×9 mm',15,198.0],['14×10 mm',15,233.06],['14×12 mm',15,274.93],
      ['15×10 mm',15,375.0],['15×11 mm',15,375.0],['15×12 mm',15,375.0],['16×12 mm',15,460.0],['18×12 mm',15,466.13],
      ['18×13 mm',15,466.13],['20×14 mm',15,722.91],
    ],
    marquise: [
      ['3×1.5 mm',100,10.62],['4×2 mm',100,10.62],['5×2.5 mm',100,12.76],['6×3 mm',70,22.66],['7×3.5 mm',60,32.53],
      ['8×4 mm',60,39.56],['9×4.5 mm',60,73.96],['10×5 mm',15,67.65],['12×6 mm',15,87.76],['14×7 mm',15,135.3],
      ['16×8 mm',15,198.2],['20×12 mm',15,604.0],
    ],
    princess: [
      ['1.5 mm',200,15.85],['1.6 mm',200,16.5],['1.75 mm',200,17.01],['2 mm',200,15.85],['2.25 mm',200,8.8],
      ['2.5 mm',200,21.86],['2.7 mm',100,22.86],['2.75 mm',100,20.38],['2.8 mm',100,22.91],['2.9 mm',100,23.0],
      ['3 mm',100,20.98],['3.25 mm',140,28.46],['3.5 mm',140,30.32],['3.75 mm',140,31.08],['4 mm',80,22.44],
      ['4.25 mm',80,36.5],['4.5 mm',80,42.29],['4.7 mm',80,65.38],['4.75 mm',80,45.38],['5 mm',60,27.68],
      ['5.25 mm',60,49.09],['5.5 mm',60,42.46],['6 mm',60,47.43],['6.5 mm',60,62.91],['7 mm',35,64.9],
      ['7.5 mm',35,81.68],['8 mm',35,82.06],['8.5 mm',15,104.98],['9 mm',15,115.5],['9.5 mm',15,135.09],
      ['10 mm',15,151.59],['11 mm',15,179.44],['12 mm',15,233.06],['13 mm',15,303.19],['14 mm',15,372.9],
      ['15 mm',15,604.1],
    ],
    cushion: [
      ['3 mm',100,32.59],['4 mm',80,32.59],['4.5 mm',80,42.28],['5 mm',60,46.61],['5.5 mm',60,51.56],
      ['6 mm',35,56.1],['6.5 mm',35,63.11],['7 mm',35,70.13],['7.5 mm',35,92.81],['8 mm',35,92.81],
      ['8.5 mm',15,92.81],['9 mm',15,115.5],['10 mm',15,151.59],['11 mm',15,179.44],['12 mm',15,233.06],
      ['13 mm',15,338.1],['14 mm',15,453.0],['15 mm',15,604.0],
    ],
    'oblong-cushion': [
      ['5×3 mm',80,26.5],['6×4 mm',70,38.0],['7×5 mm',40,55.0],['8×6 mm',40,83.0],['9×7 mm',15,106.0],
      ['10×8 mm',15,130.0],['11×9 mm',15,154.0],['12×10 mm',15,161.0],
    ],
    'curved-trillion': [
      ['4 mm',80,35.06],['5 mm',60,47.03],['5.5 mm',60,49.5],['6 mm',60,56.88],['7 mm',35,74.38],
      ['8 mm',35,98.88],['9 mm',15,123.59],['10 mm',15,160.78],['12 mm',15,216.82],
    ],
    triangle: [
      ['3.5 mm',140,25.0],['4 mm',80,42.0],['5 mm',80,47.03],['5.5 mm',60,52.88],['6 mm',60,56.88],
      ['6.5 mm',35,66.88],['7 mm',35,74.38],['8 mm',35,98.88],['9 mm',15,123.59],['10 mm',15,160.78],
    ],
    heart: [
      ['3 mm',100,23.72],['3.5 mm',100,31.5],['4 mm',80,34.69],['4.5 mm',80,37.34],['5 mm',80,47.43],
      ['5.5 mm',60,51.87],['6 mm',60,57.13],['7 mm',35,72.19],['8 mm',35,79.64],['9 mm',15,116.53],
      ['10 mm',15,136.0],['11 mm',15,179.44],['12 mm',15,233.06],['13 mm',15,299.01],['14 mm',15,453.0],
      ['15 mm',15,604.0],
    ],
    baguette: [
      ['1.5×1 mm',200,8.25],['1.6×1 mm',200,8.25],['1.7×1 mm',200,8.25],['1.8×1 mm',200,8.25],['1.9×1 mm',200,8.25],
      ['2×1 mm',200,8.25],['1.2×0.8 mm',200,8.25],['1.3×0.8 mm',200,8.25],['1.4×0.8 mm',200,8.25],['1.5×0.8 mm',200,8.25],
      ['1.6×0.8 mm',200,8.25],['1.7×0.8 mm',200,8.25],['1.8×0.8 mm',200,8.25],['1.9×0.8 mm',200,8.25],['2×0.8 mm',200,8.25],
      ['2×1.5 mm',200,8.25],['2.1×1.2 mm',200,10.25],['2.2×1.2 mm',200,10.25],['2.3×1.2 mm',200,10.25],['2.4×1.2 mm',200,10.25],
      ['2.5×1.2 mm',200,10.25],['2.5×1.5 mm',200,10.25],['2.6×1.5 mm',200,10.25],['2.7×1.5 mm',200,10.25],['2.8×1.5 mm',200,10.25],
      ['2.9×1.5 mm',200,10.25],['3×1.5 mm',200,10.25],['3×1 mm',200,14.22],['3.25×1.5 mm',100,13.13],['3.25×2 mm',100,13.13],
      ['3.5×1.5 mm',100,13.13],['3.5×2 mm',100,13.13],['3.75×1.5 mm',100,13.13],['3.75×2 mm',100,13.13],['4×1.5 mm',100,13.13],
      ['4×2 mm',100,13.13],['4×3 mm',100,18.18],['4.5×1.5 mm',100,18.18],['4.5×2 mm',100,18.18],['4.5×2.5 mm',100,18.18],
      ['5×2.5 mm',100,21.88],['5×3 mm',100,22.0],['6×3 mm',100,30.19],['6×4 mm',50,45.0],['7×5 mm',50,50.4],
      ['8×6 mm',50,85.11],['9×7 mm',15,113.4],['10×8 mm',15,151.11],['1.5×1×0.8 mm',200,8.25],['1.6×1×0.8 mm',200,8.25],
      ['1.7×1×0.8 mm',200,8.25],['1.8×1×0.8 mm',200,8.25],['1.9×1×0.8 mm',200,8.25],['2×1×0.8 mm',200,8.25],['2.1×1.2×1 mm',200,10.25],
      ['2.2×1.2×1 mm',200,10.25],['2.3×1.2×1 mm',200,10.25],['2.4×1.2×1 mm',200,10.25],['2.5×1.5×1 mm',200,10.25],['2.6×1.5×1 mm',200,10.25],
      ['2.7×1.5×1 mm',200,10.25],['2.8×1.5×1 mm',200,10.25],['2.9×1.5×1 mm',200,10.25],['3×1.5×1 mm',200,10.25],['3×2×1 mm',200,10.25],
      ['3×2×1.5 mm',100,14.22],['3.5×2×1 mm',100,14.22],['3.5×2.5×1 mm',100,14.22],['3.5×2.5×1.5 mm',100,14.22],['4×2×1 mm',100,14.22],
      ['5×3×2 mm',100,24.5],['6×3×2 mm',100,31.5],
    ],
  },
  excel: {
    round: [['0.80 mm',1000,0.875],['0.90 mm',1000,0.775],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.775],['1.50 mm',1000,0.775],['1.60 mm',1000,0.9],['1.70 mm',1000,1.025],['1.75 mm',1000,1.075],['1.80 mm',1000,1.075],['1.90 mm',1000,1.275],['2.00 mm',1000,1.275],['2.10 mm',500,1.425],['2.20 mm',500,1.425],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.875],['2.70 mm',500,1.875],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.125],['3.25 mm',200,2.3],['3.50 mm',200,3.125],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',200,5.75],['4.50 mm',200,6.25],['4.75 mm',200,8.25],['5.00 mm',200,8.25],['5.25 mm',100,9.25],['5.50 mm',100,9.25],['5.75 mm',100,12.25],['6.00 mm',100,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',25,31.25],['7.50 mm',25,19.75],['8.00 mm',25,21.25],['9.00 mm',25,40],['10.00 mm',25,48.25],['11.00 mm',25,57.5],['12.00 mm',25,71.25]],
    oval: [['3×2 mm',500,2],['3×2.5 mm',500,3.375],['4×3 mm',200,3.375],['5×3 mm',200,4],['5×4 mm',200,7],['6×4 mm',200,7.5],['7×5 mm',100,12],['8×6 mm',100,20.75],['9×7 mm',50,26.75],['10×8 mm',50,39.5],['11×9 mm',25,50.75],['12×8 mm',25,48],['12×10 mm',25,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    pear: [['3×2 mm',500,2],['3×2.5 mm',500,3.375],['4×3 mm',200,3.375],['5×3 mm',200,4],['5×4 mm',200,7],['6×4 mm',200,7.5],['7×5 mm',100,12],['8×6 mm',100,20.75],['9×7 mm',50,26.75],['10×8 mm',50,39.5],['11×9 mm',25,50.75],['12×8 mm',25,48],['12×10 mm',25,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    princess: [['2 mm',500,1.825],['2.5 mm',500,2.125],['3 mm',200,3.438],['3.5 mm',200,4.5],['4 mm',200,7],['4.5 mm',100,8.5],['5 mm',100,10.75],['6 mm',50,17],['6.5 mm',25,24],['7 mm',25,25.5],['7.5 mm',25,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',25,62.25]],
    marquise: [['3×1.5 mm',500,1.45],['4×2 mm',500,1.7],['5×2.5 mm',500,2.875],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',100,19.75],['12×6 mm',50,39.5],['14×7 mm',50,48],['16×8 mm',25,73.5]],
    heart: [['3 mm',200,4.25],['3.5 mm',200,5],['4 mm',200,5.75],['4.5 mm',200,10.75],['5 mm',100,11.25],['5.5 mm',50,14.25],['6 mm',50,17],['7 mm',25,25.5],['8 mm',25,9],['9 mm',15,48],['10 mm',15,65],['11 mm',15,84.75],['12 mm',15,99]],
    triangle: [['3 mm',200,3.75],['3.5 mm',200,5.75],['4 mm',200,6.5],['4.5 mm',100,8.5],['5 mm',100,9.25],['6 mm',50,15.5],['7 mm',50,16.25],['8 mm',50,36.75]],
    'octagon-step': [['5×3 mm',200,7],['6×4 mm',100,10],['7×5 mm',100,15.5],['8×6 mm',50,25.5],['9×7 mm',50,36.75],['10×8 mm',50,48]],
    'octagon-princess': [['5×3 mm',200,7],['6×4 mm',100,10],['7×5 mm',100,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',50,45.25]],
    cushion: [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',100,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',50,48],['10 mm',25,65]],
    'oblong-cushion': [['5×3 mm',200,7],['6×4 mm',200,10],['7×5 mm',100,15.5],['8×6 mm',100,24],['9×7 mm',50,34],['10×8 mm',50,45.25]],
  },
  deccan: {
    oval: [['2×1 mm',500,3.5],['2×1.5 mm',500,1.96],['2.25×1.5 mm',500,1.26],['2.5×1.5 mm',500,1.26],['2.5×2 mm',500,2.8],['2.75×1.5 mm',500,2.8],['2.75×2 mm',500,1.68],['3×2 mm',500,1.4],['3×2.5 mm',500,1.867],['3.25×2.25 mm',500,3.36],['3.5×2.5 mm',500,4.044],['3.75×2.75 mm',500,3.36],['4×3 mm',500,1.37],['4×2.5 mm',500,1.556],['4.5×2.5 mm',500,3.08],['4.5×3 mm',500,2.956],['4.75×3.75 mm',200,7],['5×3 mm',200,1.167],['5×4 mm',200,2.8],['5.25×4.25 mm',200,7],['5.5×4 mm',200,6.611],['5.5×4.5 mm',200,9.333],['5.75×4.75 mm',200,9.8],['6×4 mm',200,2.32],['6.25×4.25 mm',200,9.8],['6.25×5.25 mm',200,18.2],['6.5×4.5 mm',200,9.8],['6.75×4.75 mm',100,18.2],['6.75×5.75 mm',100,18.2],['7×5 mm',100,4.9],['7×6 mm',100,19.6],['7.5×5.5 mm',100,19.6],['8×6 mm',100,7.56],['8×7 mm',100,22.4],['8.5×6.5 mm',50,25.2],['9×7 mm',50,10.64],['10×8 mm',50,14],['11×7 mm',50,20.222],['11×9 mm',50,20.222],['12×10 mm',25,29.556],['12×8 mm',25,18.48],['13×11 mm',25,98],['14×10 mm',25,27.72],['16×12 mm',25,50.478],['18×13 mm',15,68.756]],
    pear: [['2×1 mm',500,3.5],['2×1.5 mm',500,1.96],['2.25×1.5 mm',500,1.26],['2.5×1.5 mm',500,1.26],['2.5×2 mm',500,2.8],['2.75×1.5 mm',500,2.8],['2.75×2 mm',500,1.68],['3×2 mm',500,1.4],['3×2.5 mm',500,1.867],['3.25×2.25 mm',500,3.36],['3.5×2.5 mm',500,4.044],['3.75×2.75 mm',500,3.36],['4×3 mm',500,1.37],['4×2.5 mm',500,1.556],['4.5×2.5 mm',500,3.08],['4.5×3 mm',500,2.956],['4.75×3.75 mm',200,7],['5×3 mm',200,1.167],['5×4 mm',200,2.8],['5.25×4.25 mm',200,7],['5.5×4 mm',200,6.611],['5.5×4.5 mm',200,9.333],['5.75×4.75 mm',200,9.8],['6×4 mm',200,2.32],['6.25×4.25 mm',200,9.8],['6.25×5.25 mm',200,18.2],['6.5×4.5 mm',200,9.8],['6.75×4.75 mm',100,18.2],['6.75×5.75 mm',100,18.2],['7×5 mm',100,4.9],['7×6 mm',100,19.6],['7.5×5.5 mm',100,19.6],['8×6 mm',100,7.56],['8×7 mm',100,22.4],['8.5×6.5 mm',50,25.2],['9×7 mm',50,10.64],['10×8 mm',50,14],['11×7 mm',50,20.222],['11×9 mm',50,20.222],['12×10 mm',25,29.556],['12×8 mm',25,18.48],['13×11 mm',25,98],['14×10 mm',25,27.72],['16×12 mm',25,50.478],['18×13 mm',15,68.756]],
    princess: [['1 mm',1000,2.5],['1.1 mm',1000,2.5],['1.2 mm',1000,2.5],['1.4 mm',1000,2.5],['1.5 mm',1000,2.5],['1.6 mm',1000,2.5],['1.7 mm',1000,2.5],['1.75 mm',1000,2.5],['1.8 mm',1000,2.5],['1.9 mm',1000,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.6],['5 mm',100,3.64],['5.5 mm',100,8.711],['6 mm',100,6.44],['6.5 mm',100,11.822],['7 mm',100,10.36],['7.5 mm',100,21.156],['8 mm',50,13.44],['8.5 mm',50,33.6],['9 mm',50,21.156],['9.5 mm',25,42],['10 mm',25,27.238],['11 mm',25,42],['12 mm',25,43.556],['14 mm',25,90.222]],
    marquise: [['2×1 mm',500,3.5],['2×1.5 mm',500,3.5],['2.5×1.5 mm',500,3.5],['2.75×1.5 mm',500,3.5],['2.75×2 mm',500,3.5],['3×1.5 mm',500,0.55],['3.5×2 mm',500,3.5],['3.5×2.5 mm',500,3.78],['3.75×2 mm',500,3.5],['4×2 mm',500,0.73],['4×2.5 mm',500,3.5],['4.5×2.5 mm',500,3.5],['4.75×2.5 mm',200,3.5],['5×2.5 mm',200,1.01],['5×2 mm',200,3.5],['5×3 mm',200,3.5],['5.5×3 mm',200,3.5],['5.73×3 mm',200,3.5],['6×3 mm',200,1.74],['7×3.5 mm',200,2.8],['8×4 mm',100,3.92],['9×4.5 mm',100,7.7],['10×5 mm',50,10.5],['12×6 mm',25,27.37],['14×7 mm',25,20.362],['16×8 mm',25,30.411],['18×9 mm',25,51.333]],
    heart: [['2 mm',500,2.45],['2.5 mm',200,2.45],['3 mm',200,2.333],['4 mm',200,2.956],['5 mm',100,4.34],['6 mm',100,6.44],['7 mm',100,9.333],['8 mm',50,13.067],['8.5 mm',50,43.556],['9 mm',50,18.48],['9.5 mm',25,52.889],['10 mm',25,24.889],['11 mm',25,40.444],['12 mm',25,43.556],['13 mm',25,76.222],['14 mm',25,77.778],['15 mm',25,93.333]],
    triangle: [['2 mm',500,2.5],['2.5 mm',500,2.5],['3 mm',500,2],['3.5 mm',500,2],['4 mm',200,2.5],['5 mm',100,3.5],['6 mm',100,6.16],['7 mm',50,9.24],['8 mm',50,12.6],['9 mm',50,19.6],['10 mm',25,26.6],['11 mm',25,49.778],['12 mm',25,56]],
    'octagon-step': [['1.75×1 mm',500,9.333],['2×1 mm',500,9.333],['2.5×1.5 mm',500,9.333],['2.75×1.5 mm',500,9.333],['3×2 mm',500,9.333],['3.25×2.5 mm',500,9.333],['3.5×2.5 mm',500,4.2],['3.75×2.5 mm',500,9.333],['4×2 mm',500,9.333],['4×2.5 mm',500,9.333],['4×3 mm',500,4.2],['4.5×2.5 mm',500,9.333],['4.5×3 mm',500,9.333],['4.5×3.5 mm',200,7.622],['5×3 mm',200,2.39],['6×4 mm',200,4.9],['7×5 mm',100,7.84],['8×6 mm',100,12.6]],
    'octagon-princess': [['4×3 mm',500,2.06],['5×3 mm',200,2.35],['6×4 mm',200,3.5],['7×5 mm',100,5.88],['8×6 mm',100,8.96],['9×7 mm',50,12.6],['10×8 mm',50,17.64],['11×9 mm',25,26.6],['12×10 mm',25,33.6],['14×10 mm',25,42],['14×12 mm',25,67.2],['16×12 mm',15,72.8]],
    cushion: [['2 mm',200,1.991],['2.5 mm',200,1.991],['3 mm',200,1.983],['3.5 mm',200,2.784],['4 mm',200,2.777],['4.5 mm',100,4.496],['5 mm',100,4.496],['5.5 mm',100,6.876],['6 mm',100,6.876],['7 mm',50,10.049],['8 mm',50,13.222],['9 mm',50,22.4],['10 mm',25,25.916],['12 mm',25,26.33]],
    asscher: [['3 mm',200,6.65],['4 mm',200,7],['5 mm',100,7.06],['6 mm',100,15.75],['7 mm',50,16.884],['8 mm',50,30.8],['9 mm',50,52.92],['10 mm',25,54.6]],
    clover: [['4 mm',200,6.3],['5 mm',200,11.34],['6 mm',200,12.6],['7 mm',100,22.68],['8 mm',100,25.2]],
    flower5: [['4 mm',200,3.36],['5 mm',100,4.48],['6 mm',100,7.28],['7 mm',50,10.64],['8 mm',50,13.44],['9 mm',50,22.96],['10 mm',25,29.4]],
    tapered: [['1.1×1×0.8 mm',1000,1],['1.2×1×0.8 mm',1000,1],['1.3×1×0.8 mm',1000,1],['1.4×1×0.8 mm',1000,1],['1.5×1×0.8 mm',1000,1],['1.5×1.25×1 mm',1000,1],['1.6×1×0.8 mm',1000,1],['1.7×1×0.8 mm',1000,1],['1.75×1.5×1 mm',1000,1],['1.8×1×0.8 mm',1000,1],['1.9×1×0.8 mm',1000,1],['2×1×0.8 mm',1000,1],['2×1.5×1 mm',1000,1],['2.1×1×0.8 mm',1000,1],['2.1×1.2×1 mm',1000,1],['2.1×1.5×1 mm',1000,1],['2.2×1×0.8 mm',1000,1],['2.2×1.2×1 mm',1000,1],['2.2×1.5×1 mm',1000,1],['2.25×1.5×1 mm',1000,1],['2.3×1×0.8 mm',1000,1],['2.3×1.2×1 mm',1000,1],['2.3×1.5×1 mm',1000,1],['2.4×1×0.8 mm',1000,1],['2.4×1.2×1 mm',1000,1],['2.4×1.5×1 mm',1000,1],['2.5×1×0.8 mm',1000,1],['2.5×1.2×1 mm',1000,1],['2.5×1.5×1 mm',1000,1],['2.5×2×1 mm',500,1],['2.5×2×1.5 mm',500,1],['2.6×1.5×1 mm',1000,1],['2.7×1.5×1 mm',1000,1],['2.75×1.5×1 mm',1000,1],['2.8×1.5×1 mm',1000,1],['2.9×1×5×1 mm',200,1],['3×1.5×1 mm',1000,1],['3×2×1 mm',1000,1.5],['3×2×1.5 mm',1000,1.5],['3.25×1.5×1 mm',500,1.5],['3.25×2×1.5 mm',500,1.5],['3.25×2.5×1.5 mm',500,1.5],['3.5×1.5×1 mm',500,1.5],['3.5×2×1 mm',500,1.5],['3.5×2×1.5 mm',500,1.5],['3.5×2.5×1.5 mm',500,1.5],['3.75×2×1.5 mm',500,1.5],['3.75×2.5×1.5 mm',500,1.5],['4×1.5×1 mm',1000,2],['4×2×1 mm',500,1.5],['4×2×1.5 mm',500,2],['4×2.5×1.5 mm',500,2],['4.5×2.5×1.5 mm',500,2],['5×2×1 mm',500,2.5],['5×2×1.5 mm',500,2.5],['5×2.5×1.5 mm',200,2.5],['5×2.5×1 mm',200,2.5],['5×3×1 mm',200,2.5],['5×3×2 mm',200,2.5],['6×3×2 mm',200,3]],
    baguette: [['1.1×0.8 mm',1000,1],['1.2×0.8 mm',1000,1],['1.2×1 mm',200,1],['1.3×0.8 mm',1000,1],['1.3×1 mm',200,1],['1.4×0.8 mm',1000,1],['1.4×1 mm',200,1],['1.5×0.8 mm',1000,1],['1.5×1 mm',200,1],['1.6×0.8 mm',1000,1],['1.6×1 mm',200,1],['1.7×0.8 mm',1000,1],['1.7×1 mm',200,1],['1.75×1 mm',200,1],['1.8×0.8 mm',1000,1],['1.8×1 mm',200,1],['1.9×0.8 mm',1000,1],['1.9×1 mm',200,1],['2×0.8 mm',1000,1],['2×1 mm',1000,1],['2×1.25 mm',200,1],['2×1.5 mm',1000,1],['2.1×1 mm',200,1],['2.1×1.2 mm',200,1],['2.1×1.25 mm',1000,1],['2.1×1.5 mm',1000,1],['2.2×1 mm',200,1],['2.2×1.2 mm',200,1],['2.2×1.25 mm',1000,1],['2.2×1.5 mm',1000,1],['2.3×1 mm',200,1],['2.3×1.2 mm',200,1],['2.3×1.25 mm',1000,1],['2.3×1.5 mm',1000,1],['2.4×1 mm',200,1],['2.4×1.2 mm',200,1],['2.4×1.25 mm',1000,1],['2.4×1.5 mm',1000,1],['2.5×1.2 mm',200,1],['2.5×1.25 mm',1000,1],['2.5×1.5 mm',1000,1],['2.5×2 mm',500,1],['2.6×1.25 mm',1000,1],['2.6×1.5 mm',1000,1],['2.7×1.25 mm',1000,1],['2.75×1.5 mm',1000,1],['2.75×1.75 mm',200,1],['2.8×1.25 mm',1000,1],['2.8×1.5 mm',1000,1],['2.9×1.25 mm',1000,1],['2.9×1.5 mm',1000,1],['3×1.5 mm',1000,1],['3×2 mm',1000,1.5],['3×2.5 mm',1000,1],['3.25×1.25 mm',1000,1.5],['3.25×1.5 mm',500,1.5],['3.25×2 mm',500,1.5],['3.5×1.5 mm',500,1.5],['3.5×1.75 mm',500,1.5],['3.5×2 mm',500,1.5],['3.75×2 mm',1000,1.5],['4×1 mm',500,1.5],['4×1.5 mm',500,1.5],['4×2 mm',500,2],['4×2.5 mm',500,2],['4×3 mm',500,2],['4×3.5 mm',500,2],['4.25×1.5 mm',200,2],['4.5×2 mm',200,2],['4.5×2.5 mm',500,2],['4.5×3 mm',500,2],['5×2.5 mm',200,2.5],['5×3 mm',200,2.5],['6×3 mm',200,3],['7×5 mm',200,4.9],['8×4 mm',200,4.9]],
  },
};
const WHITEFANCY_SHAPES_BY_GRADE = {
  leplus: ['round','oval','pear','marquise','princess','cushion','oblong-cushion','asscher','octagon-princess','octagon-step','curved-trillion','heart','star'],
  audesus: ['round','oval','pear','marquise','princess','cushion','oblong-cushion','curved-trillion','triangle','heart','baguette'],
  excel: ['round','oval','pear','princess','marquise','heart','triangle','octagon-step','octagon-princess','cushion','oblong-cushion'],
  deccan: ['oval','pear','princess','marquise','heart','triangle','octagon-step','octagon-princess','cushion','asscher','clover','flower5','tapered','baguette'],
};
function wfSizes(gradeId, shape) {
  const g = WHITEFANCY_SHEETS[gradeId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function wfSku(gradeId, shape, size) {
  const g = WHITEFANCY_SHEETS[gradeId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'wf-' + gradeId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.wfSizes = wfSizes;
window.wfSku = wfSku;
window.WHITEFANCY_SHAPES_BY_GRADE = WHITEFANCY_SHAPES_BY_GRADE;

// White Round CZ · per-subgrade round price+weight sheets. Row: [size, pcs/box,
// ₹/piece, grams per 1000 pc]. GQ H and Elanza held pending clarification.
// White Round CZ · per-subgrade round price+weight sheets. Row: [size, pcs/box,
// ₹/piece, grams per 1000 pc]. GQ H and Elanza held pending clarification.
const WHITECZ_SHEETS = {
  'elements-thin': { round: [
      ['0.80 mm',1000,0.8,0.86],['0.90 mm',1000,0.8,1.18],['1.00 mm',1000,0.8,1.58],['1.10 mm',1000,0.8,2.1],['1.20 mm',1000,0.8,2.72],
      ['1.30 mm',1000,0.8,3.46],['1.40 mm',1000,0.8,4.32],['1.50 mm',1000,0.8,5.4],['1.60 mm',1000,0.8,6.43],['1.70 mm',1000,1.0,7.58],
      ['1.80 mm',1000,1.0,8.87],['1.90 mm',1000,1.2,10.28],['2.00 mm',1000,1.2,11.85],['2.10 mm',500,1.39,13.72],['2.20 mm',500,1.78,15.77],
      ['2.30 mm',500,1.78,18.02],['2.40 mm',500,2.04,20.47],['2.50 mm',500,2.04,23.15],['2.60 mm',500,2.04,26.03],['2.70 mm',500,3.19,29.15],
      ['2.80 mm',500,3.19,32.52],['2.90 mm',500,3.51,36.13],['3.00 mm',500,3.51,39.99],['3.25 mm',200,5.04,50.11],['3.50 mm',200,6.16,61.71],
      ['3.75 mm',200,6.81,74.97],['4.00 mm',200,7.46,89.99],['4.25 mm',200,9.54,106.9],['4.50 mm',100,10.61,125.79],['4.75 mm',100,12.53,146.78],
      ['5.00 mm',100,14.05,169.98],
  ] },
  'elements-normal': { round: [
      ['0.80 mm',1000,0.8,0.97],['0.90 mm',1000,0.8,1.28],['1.00 mm',1000,0.8,1.85],['1.10 mm',1000,0.8,2.42],['1.20 mm',1000,0.8,3.1],
      ['1.30 mm',1000,0.8,3.9],['1.40 mm',1000,0.8,4.9],['1.50 mm',1000,0.8,5.6],['1.60 mm',1000,0.8,6.83],['1.70 mm',1000,1.0,8.4],
      ['1.80 mm',1000,1.0,9.77],['1.90 mm',1000,1.2,10.71],['2.00 mm',1000,1.2,12.81],['2.10 mm',500,1.39,15.4],['2.20 mm',500,1.78,17.67],
      ['2.30 mm',500,1.78,19.45],['2.40 mm',500,2.04,21.2],['2.50 mm',500,2.04,25.45],['2.60 mm',500,2.04,27.5],['2.70 mm',500,3.19,29.93],
      ['2.80 mm',500,3.19,32.76],['2.90 mm',500,3.51,37.49],['3.00 mm',500,3.51,39.93],['3.25 mm',200,5.04,53.5],['3.50 mm',200,6.16,66.3],
      ['3.75 mm',200,6.81,80.17],['4.00 mm',200,7.46,97.6],['4.25 mm',200,9.54,109.0],['4.50 mm',100,10.61,133.0],['4.75 mm',100,12.53,150.0],
      ['5.00 mm',100,14.05,173.0],
  ] },
  'elements-h': { round: [
      ['0.80 mm',1000,0.8,1.15],['0.90 mm',1000,0.8,1.65],['1.00 mm',1000,0.8,1.93],['1.10 mm',1000,0.8,2.6],['1.20 mm',1000,0.8,3.32],
      ['1.30 mm',1000,0.8,4.25],['1.40 mm',1000,0.8,5.16],['1.50 mm',1000,0.8,6.6],['1.60 mm',1000,0.8,7.38],['1.70 mm',1000,1.0,9.04],
      ['1.80 mm',1000,1.0,10.52],['1.90 mm',1000,1.2,12.23],['2.00 mm',1000,1.2,14.1],['2.10 mm',500,1.39,16.0],['2.20 mm',500,1.78,18.6],
      ['2.30 mm',500,1.78,20.6],['2.40 mm',500,2.04,23.9],['2.50 mm',500,2.04,26.4],['2.60 mm',500,2.04,29.0],['2.70 mm',500,3.19,32.6],
      ['2.80 mm',500,3.19,36.4],['2.90 mm',500,3.51,39.8],['3.00 mm',500,3.51,43.0],
  ] },
  'elements-hea': { round: [
      ['1.00 mm',1000,0.81,2.3],['1.05 mm',1000,0.81,2.4],['1.10 mm',1000,0.81,2.75],['1.15 mm',1000,0.81,3.0],['1.20 mm',1000,0.81,3.7],
      ['1.25 mm',1000,0.81,4.0],['1.30 mm',1000,0.81,4.4],['1.35 mm',1000,0.81,4.8],['1.40 mm',1000,0.81,5.5],['1.45 mm',1000,0.81,6.1],
      ['1.50 mm',1000,0.81,6.8],['1.55 mm',1000,0.83,7.4],['1.60 mm',1000,0.83,8.4],
  ] },
  'gq-gq': { round: [
      ['0.70 mm',1000,0.54,0.74],['0.80 mm',1000,0.54,0.97],['0.90 mm',1000,0.54,1.28],['1.00 mm',1000,0.54,1.89],['1.10 mm',1000,0.54,2.31],
      ['1.20 mm',1000,0.54,2.94],['1.25 mm',1000,0.54,3.31],['1.30 mm',1000,0.54,3.83],['1.40 mm',1000,0.54,4.67],['1.50 mm',1000,0.54,5.72],
      ['1.60 mm',1000,0.54,6.93],['1.70 mm',1000,0.69,8.56],['1.75 mm',1000,0.69,9.08],['1.80 mm',1000,0.69,9.61],['1.90 mm',1000,0.75,10.7],
      ['2.00 mm',1000,0.75,12.81],['2.10 mm',500,0.75,14.7],['2.20 mm',500,0.86,17.67],['2.25 mm',500,0.91,18.17],['2.30 mm',500,0.97,19.45],
      ['2.40 mm',500,1.01,21.2],['2.50 mm',500,1.08,25.45],['2.60 mm',500,1.19,27.5],['2.70 mm',500,1.29,29.93],['2.75 mm',500,1.34,31.4],
      ['2.80 mm',500,1.4,32.76],['2.90 mm',500,1.51,37.49],['3.00 mm',500,1.73,39.3],['3.10 mm',200,2.37,43.75],['3.20 mm',200,2.37,50.75],
      ['3.25 mm',200,2.7,53.5],['3.30 mm',200,2.91,56.61],['3.40 mm',200,3.13,59.67],['3.50 mm',200,3.34,66.3],['3.60 mm',200,3.56,71.74],
      ['3.70 mm',200,3.56,78.13],['3.75 mm',200,3.77,80.17],['3.80 mm',200,3.77,82.0],['3.90 mm',200,4.1,83.2],['4.00 mm',200,4.31,97.6],
      ['4.25 mm',200,5.39,109.0],['4.50 mm',100,6.47,133.0],['4.75 mm',100,6.9,150.0],['5.00 mm',100,7.55,173.0],
  ] },
  'gq-hh': { round: [
      ['1.00 mm',1000,0.67,3.85],['1.10 mm',1000,0.67,4.4],['1.15 mm',1000,0.67,4.45],['1.20 mm',1000,0.67,4.5],['1.25 mm',1000,0.67,5.0],
      ['1.30 mm',1000,0.67,6.0],['1.35 mm',1000,0.67,6.6],['1.40 mm',1000,0.67,7.4],['1.45 mm',1000,0.67,8.6],['1.50 mm',1000,0.67,9.2],
      ['1.55 mm',1000,0.73,11.0],['1.60 mm',1000,0.73,12.4],['1.65 mm',1000,0.73,13.0],['1.70 mm',1000,0.86,13.8],['1.75 mm',1000,0.93,14.0],
      ['1.80 mm',1000,0.93,14.6],['1.85 mm',1000,0.93,15.0],['1.90 mm',1000,0.96,16.8],['1.95 mm',1000,1.08,17.85],['2.00 mm',1000,1.11,19.2],
      ['2.10 mm',500,1.11,22.4],['2.20 mm',500,1.24,23.5],['2.25 mm',500,1.24,24.0],['2.30 mm',500,1.4,27.0],['2.40 mm',500,1.61,31.0],
      ['2.50 mm',500,1.66,34.0],['2.60 mm',500,1.74,40.0],['2.70 mm',500,1.8,44.4],['2.75 mm',500,1.8,46.25],['2.80 mm',500,1.97,48.0],
      ['2.90 mm',500,2.16,52.0],['3.00 mm',500,2.32,60.0],['3.10 mm',200,1.96,69.0],['3.20 mm',200,2.35,null],['3.25 mm',200,2.35,86.0],
      ['3.30 mm',200,2.58,92.0],['3.40 mm',200,2.7,93.0],['3.50 mm',200,2.9,95.0],['3.60 mm',200,3.03,109.0],['3.70 mm',200,3.03,110.0],
      ['3.75 mm',200,3.25,120.0],['3.80 mm',200,3.71,130.0],['3.90 mm',200,3.71,135.0],['4.00 mm',200,3.85,140.0],
  ] },
  'gq-hhh': { round: [
      ['1.00 mm',1000,0.6663,3.8],['1.10 mm',1000,0.6663,4.4],['1.15 mm',1000,0.6663,4.7],['1.20 mm',1000,0.6663,5.6],['1.25 mm',1000,0.6663,6.4],
      ['1.30 mm',1000,0.6663,7.6],['1.35 mm',1000,0.6663,8.3],['1.40 mm',1000,0.6663,9.8],['1.45 mm',1000,0.6663,10.6],['1.50 mm',1000,0.6663,12.0],
      ['1.55 mm',1000,0.7313,13.2],['1.60 mm',1000,0.7313,14.2],['1.65 mm',1000,0.7313,15.6],['1.70 mm',1000,0.86,16.6],['1.75 mm',1000,0.93,18.2],
      ['1.80 mm',1000,0.93,18.9],['1.90 mm',1000,0.9587,20.2],['2.00 mm',1000,1.08,21.8],['2.10 mm',500,1.105,26.0],['2.20 mm',500,1.235,30.0],
      ['2.30 mm',500,1.3975,32.236],['2.40 mm',500,1.6087,33.2],['2.50 mm',500,1.6575,40.0],['2.60 mm',500,1.7388,42.4],['2.70 mm',500,1.8038,null],
      ['2.80 mm',500,1.9663,null],['2.90 mm',500,2.1612,null],['3.00 mm',500,2.3237,null],
  ] },
  'euroaaa': { round: [
      ['0.80 mm',1000,0.23,0.9],['0.90 mm',1000,0.23,1.48],['1.00 mm',1000,0.23,1.78],['1.05 mm',1000,0.23,null],['1.10 mm',1000,0.23,2.22],
      ['1.15 mm',1000,0.23,2.42],['1.20 mm',1000,0.23,2.78],['1.25 mm',1000,0.23,null],['1.30 mm',1000,0.23,3.58],['1.35 mm',1000,0.23,null],
      ['1.40 mm',1000,0.25,4.82],['1.45 mm',1000,0.25,null],['1.50 mm',1000,0.25,5.56],['1.55 mm',1000,0.252,null],['1.60 mm',1000,0.27,6.73],
      ['1.65 mm',1000,0.27,null],['1.70 mm',1000,0.37,8.76],['1.75 mm',1000,0.37,null],['1.80 mm',1000,0.37,9.45],['1.85 mm',1000,0.37,null],
      ['1.90 mm',1000,0.37,11.3],['2.00 mm',1000,0.405,12.9],['2.10 mm',500,0.57,15.88],['2.20 mm',500,0.57,16.38],['2.25 mm',500,0.57,18.42],
      ['2.30 mm',500,0.64,19.78],['2.40 mm',500,0.67,22.32],['2.50 mm',500,0.71,23.8],['2.60 mm',500,0.81,27.5],['2.70 mm',500,0.87,30.36],
      ['2.75 mm',500,0.93,31.58],['2.80 mm',500,1.0,32.72],['2.90 mm',500,1.12,35.9],['3.00 mm',500,1.16,38.6],['3.10 mm',200,1.17,null],
      ['3.20 mm',200,1.17,null],['3.25 mm',200,1.44,48.7],['3.30 mm',200,1.96,null],['3.40 mm',200,1.96,null],['3.50 mm',200,1.96,66.55],
      ['3.60 mm',200,1.96,null],['3.70 mm',200,1.96,null],['3.75 mm',200,2.27,69.75],['3.80 mm',200,2.27,null],['3.90 mm',200,2.58,null],
      ['4.00 mm',200,2.58,43.3],['4.25 mm',200,2.89,105.4],['4.50 mm',100,3.3,127.3],['4.75 mm',100,3.92,139.5],['5.00 mm',100,4.33,164.8],
      ['5.25 mm',100,4.55,200.5],['5.50 mm',100,4.6,213.3],['5.75 mm',100,5.22,245.6],['6.00 mm',100,5.4,294.0],['6.25 mm',50,6.16,322.2],
      ['6.50 mm',50,7.2,367.0],['6.75 mm',50,7.7,420.8],['7.00 mm',50,8.8,442.4],['7.50 mm',25,9.9,null],['8.00 mm',25,11.16,681.6],
      ['8.50 mm',25,14.4,808.0],['9.00 mm',25,15.3,964.8],['9.50 mm',25,17.28,null],['10.00 mm',25,18.0,null],
  ] },
  'gq-h': { round: [
      ['0.90 mm',1000,0.54,1.58],['1.00 mm',1000,0.54,1.93],['1.05 mm',1000,0.54,2.06],['1.10 mm',1000,0.54,2.6],['1.15 mm',1000,0.54,2.72],
      ['1.20 mm',1000,0.54,3.32],['1.25 mm',1000,0.54,3.54],['1.30 mm',1000,0.54,4.25],['1.35 mm',1000,0.54,4.28],['1.40 mm',1000,0.54,5.16],
      ['1.45 mm',1000,0.54,5.72],['1.50 mm',1000,0.54,6.6],['1.55 mm',1000,0.54,6.78],['1.60 mm',1000,0.54,7.38],['1.65 mm',1000,0.54,8.37],
      ['1.70 mm',1000,0.69,9.04],['1.75 mm',1000,0.69,9.67],['1.80 mm',1000,0.69,10.52],['1.85 mm',1000,0.75,11.57],['1.90 mm',1000,0.75,12.23],
      ['1.95 mm',1000,0.75,13.17],['2.00 mm',1000,0.75,14.1],['2.05 mm',500,0.75,15.05],['2.10 mm',500,0.75,16.0],['2.15 mm',500,0.86,17.3],
      ['2.20 mm',500,0.86,18.6],['2.25 mm',500,0.97,19.6],['2.30 mm',500,1.01,20.6],['2.35 mm',500,1.01,20.95],['2.40 mm',500,1.08,23.9],
      ['2.45 mm',500,1.08,25.06],['2.50 mm',500,1.08,26.4],['2.60 mm',500,1.19,29.0],['2.70 mm',500,1.29,32.6],['2.75 mm',500,1.34,35.42],
      ['2.80 mm',500,1.4,36.4],['2.90 mm',500,1.51,39.8],['3.00 mm',500,1.73,43.0],
  ] },
};
function czSizes(gradeId, shape) {
  const g = WHITECZ_SHEETS[gradeId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function czSku(gradeId, shape, size) {
  const g = WHITECZ_SHEETS[gradeId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'cz-' + gradeId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row[3] != null ? row[3] : null };
}
function czHasWeight(gradeId, shape) {
  const g = WHITECZ_SHEETS[gradeId];
  return !!(g && g[shape] && g[shape].some((r) => r[3] != null));
}
window.czSizes = czSizes;
window.czSku = czSku;
window.czHasWeight = czHasWeight;

// Color CZ (category 'cz') per grade+colour price sheets, from the RIVEN tabs of
// the colour files. Row: [size, pcs/box, ₹/piece]. No packing column in these
// sheets, so pcs/box is filled from the standard MOQ ladder (per shape+size).
// Aqua's three shades (#37/#38/#39) share one price → keyed under 'excele|aqua'.
const CZ_SHEETS = {
  'excele|rhodolite': {
    'oval': [['3×2 mm',200,4.62],['4×3 mm',100,6.5],['3.5×2.5 mm',200,5.72],['4.5×3.5 mm',100,7.94],['5×3 mm',100,10.39],['6×4 mm',100,16.62],['7×5 mm',50,17.66],['8×6 mm',50,22.86],['9×7 mm',50,40.58],['10×8 mm',25,55],['11×9 mm',25,103.89],['12×10 mm',15,82.5],['14×10 mm',15,155.83],['14×12 mm',15,187],['16×12 mm',15,228.56]],
    'pear': [['3×2 mm',200,4.62],['4×3 mm',100,6.5],['3.5×2.5 mm',200,5.72],['4.5×3.5 mm',100,7.94],['5×3 mm',100,10.39],['6×4 mm',100,16.62],['7×5 mm',50,17.66],['8×6 mm',50,22.86],['9×7 mm',50,40.58],['10×8 mm',25,55],['11×9 mm',25,103.89],['12×10 mm',15,82.5],['14×10 mm',15,155.83],['14×12 mm',15,187],['16×12 mm',15,228.56]],
    'round': [['0.80 mm',1000,1.32],['0.90 mm',1000,0.88],['1.00 mm',1000,0.65],['1.10 mm',1000,0.92],['1.20 mm',1000,0.79],['1.30 mm',1000,0.84],['1.40 mm',1000,0.94],['1.50 mm',1000,1.03],['1.60 mm',1000,1.12],['1.70 mm',1000,1.22],['1.80 mm',1000,1.31],['1.90 mm',1000,1.4],['2.00 mm',1000,1.5],['2.25 mm',500,2.24],['2.50 mm',500,2.62],['2.75 mm',500,3.37],['3.00 mm',500,4.11],['3.25 mm',200,5.61],['3.50 mm',200,6.17],['4.00 mm',200,11.66],['4.50 mm',100,13.09],['5.00 mm',100,18.7],['5.50 mm',50,20.57],['6.00 mm',50,29.7],['6.50 mm',50,29.92],['7.00 mm',50,37.4],['8.00 mm',50,46.75],['9.00 mm',50,65.45],['10.00 mm',50,93.5]],
    'marquise': [['3×1.5 mm',200,4.68],['4×2 mm',200,5.06],['5×2.5 mm',200,8.31],['6×3 mm',200,13.51],['7×3.5 mm',100,17.04],['8×4 mm',100,24.93],['9×4.5 mm',50,35.2],['10×5 mm',50,41.56],['12×6 mm',15,64.41],['14×7 mm',15,93.5],['16×8 mm',15,145.44]],
    'octagon-princess': [['5×3 mm',200,9.41],['6×4 mm',100,12.1],['7×5 mm',50,25.13],['8×6 mm',50,26.13],['9×7 mm',25,46.2],['10×8 mm',25,60.5],['12×8 mm',15,127.6],['11×9 mm',15,124.67],['12×10 mm',15,145.44],['14×10 mm',15,176],['16×12 mm',15,249.33],['18×13 mm',15,290.89]],
    'baguette': [['6×3 mm',100,6.6]],
  },
  'excele|brown': {
    'oval': [['3×2 mm',200,11],['4×2 mm',100,11],['4×3 mm',100,13.2],['5×3 mm',100,15.4],['5×4 mm',100,19.8],['6×4 mm',100,22],['7×5 mm',50,33],['8×5 mm',50,39.6],['8×6 mm',50,44],['9×6 mm',50,63.8],['9×7 mm',50,70.4],['10×7 mm',25,83.6],['10×8 mm',25,92.4],['12×8 mm',15,132],['11×9 mm',25,132],['12×9 mm',15,143],['13×9 mm',15,154],['14×9 mm',15,165],['12×10 mm',15,158.4],['14×10 mm',15,198],['15×10 mm',15,220],['14×12 mm',15,242],['16×12 mm',15,286],['18×13 mm',15,374],['20×15 mm',15,484]],
    'pear': [['3×2 mm',200,11],['4×2 mm',100,11],['4×3 mm',100,13.2],['5×3 mm',100,15.4],['5×4 mm',100,19.8],['6×4 mm',100,22],['7×5 mm',50,33],['8×5 mm',50,39.6],['8×6 mm',50,44],['9×6 mm',50,63.8],['9×7 mm',50,70.4],['10×7 mm',25,83.6],['10×8 mm',25,92.4],['12×8 mm',15,132],['11×9 mm',25,132],['12×9 mm',15,143],['13×9 mm',15,154],['14×9 mm',15,165],['12×10 mm',15,158.4],['14×10 mm',15,198],['15×10 mm',15,220],['14×12 mm',15,242],['16×12 mm',15,286],['18×13 mm',15,374],['20×15 mm',15,484]],
    'round': [['0.80 mm',1000,1.12],['0.90 mm',1000,1.1],['1.00 mm',1000,0.81],['1.10 mm',1000,0.88],['1.20 mm',1000,0.99],['1.30 mm',1000,1.1],['1.40 mm',1000,1.21],['1.50 mm',1000,1.32],['1.60 mm',1000,1.54],['1.70 mm',1000,1.98],['1.80 mm',1000,2.2],['1.90 mm',1000,2.42],['2.00 mm',1000,2.64],['2.10 mm',500,2.86],['2.20 mm',500,3.52],['2.25 mm',500,3.96],['2.30 mm',500,3.96],['2.40 mm',500,4.18],['2.50 mm',500,4.4],['2.75 mm',500,5.61],['3.00 mm',500,6.23],['3.25 mm',200,7.71],['3.50 mm',200,10.96],['4.00 mm',200,12.47],['4.50 mm',100,16.62],['5.00 mm',100,22],['5.50 mm',50,31.17],['6.00 mm',50,34.28],['6.50 mm',50,39.48],['7.00 mm',50,47.79],['8.00 mm',50,60.38],['9.00 mm',50,67.34],['10.00 mm',50,124.67],['11.00 mm',50,160.6],['12.00 mm',50,220],['13.00 mm',50,275],['14.00 mm',50,308],['15.00 mm',50,374],['16.00 mm',50,484],['17.00 mm',50,572],['18.00 mm',50,726],['19.00 mm',50,836],['20.00 mm',50,990]],
    'octagon-princess': [['3×1.5 mm',200,10.56],['3×2 mm',200,10.56],['4×2 mm',200,10.56],['5×2.5 mm',200,12.1],['5×3 mm',200,17.16],['6×3 mm',100,19.8],['6×4 mm',100,26.4],['8×4 mm',50,33],['7×5 mm',50,44],['8×6 mm',50,57.2],['9×6 mm',25,66],['10×6 mm',25,79.2],['12×6 mm',15,83.6],['9×7 mm',25,83.6],['10×8 mm',25,110],['12×8 mm',15,143],['14×8 mm',15,169.4],['11×9 mm',15,143],['12×10 mm',15,165],['14×10 mm',15,242],['15×11 mm',15,264],['14×12 mm',15,264],['16×12 mm',15,286],['18×13 mm',15,418]],
    'marquise': [['3×1.5 mm',200,6.6],['4×2 mm',200,9.24],['5×2.5 mm',200,10.56],['6×3 mm',200,16.72],['7×3.5 mm',100,22],['8×4 mm',100,30.8],['9×4.5 mm',50,41.8],['10×5 mm',50,61.6],['11×5.5 mm',15,70.4],['12×6 mm',15,79.2],['13×6.5 mm',15,94.6],['14×7 mm',15,114.4],['16×8 mm',15,160.6],['19×8 mm',15,215.6],['20×10 mm',15,275]],
    'cushion': [['3 mm',200,8.8],['4 mm',200,16.5],['5 mm',100,22],['6 mm',50,33],['7 mm',50,46.2],['8 mm',50,57.2]],
    'baguette': [['2×1 mm',200,5.5],['2.5×1.5 mm',200,5.5],['3×1.5 mm',200,6.6],['4×2 mm',200,8.36]],
    'asscher': [['4 mm',200,14.3],['5 mm',100,19.8],['6 mm',100,34.1],['7 mm',50,55],['8 mm',50,72.6],['9 mm',25,99],['10 mm',25,116.6]],
  },
  'excele|aqua': {
    'round': [['0.70 mm',1000,1.49],['0.80 mm',1000,1.32],['0.90 mm',1000,1.32],['1.00 mm',1000,1.32],['1.10 mm',1000,1.32],['1.20 mm',1000,1.43],['1.30 mm',1000,1.54],['1.40 mm',1000,1.61],['1.50 mm',1000,1.72],['1.60 mm',1000,1.87],['1.70 mm',1000,2.09],['1.80 mm',1000,2.31],['1.90 mm',1000,2.53],['2.00 mm',1000,3.08],['2.10 mm',500,3.19],['2.20 mm',500,3.41],['2.30 mm',500,3.63],['2.40 mm',500,4.18],['2.50 mm',500,4.51],['2.60 mm',500,4.84],['2.70 mm',500,5.5],['2.80 mm',500,5.94],['2.90 mm',500,6.38],['3.00 mm',500,6.6],['3.10 mm',200,7.7],['3.20 mm',200,8.36],['3.25 mm',200,8.36],['3.30 mm',200,9.24],['3.40 mm',200,9.9],['3.50 mm',200,10.56],['3.60 mm',200,11.44],['3.70 mm',200,12.32],['3.75 mm',200,12.76],['3.80 mm',200,13.2],['3.90 mm',200,13.86],['4.00 mm',200,16.26],['4.25 mm',100,16.5],['4.50 mm',100,18.7],['4.75 mm',100,20.9],['5.00 mm',100,26.4],['5.25 mm',50,27.5],['5.50 mm',50,30.8],['5.75 mm',50,35.2],['6.00 mm',50,39.6],['6.50 mm',50,50.6],['7.00 mm',50,57.2],['7.50 mm',50,77],['8.00 mm',50,83.6],['8.50 mm',50,105.11],['9.00 mm',50,110],['10.00 mm',50,160.23],['11.00 mm',50,220],['12.00 mm',50,361.78]],
    'pear': [['3×2 mm',200,11],['3×2.5 mm',200,8.36],['3.5×2.5 mm',200,9.78],['4×2 mm',100,9.9],['4×3 mm',100,11.12],['4.5×3.5 mm',100,13.64],['5×3 mm',100,13.2],['5×4 mm',100,19.8],['6×4 mm',100,24.2],['7×5 mm',50,37.4],['8×6 mm',50,56.22],['9×6 mm',50,78.22],['9×7 mm',50,79.2],['10×7 mm',25,99],['10×8 mm',25,107.56],['11×8 mm',25,121],['11×9 mm',25,143],['12×8 mm',15,154],['12×10 mm',15,209],['14×10 mm',15,226.11],['12×9 mm',15,187]],
    'oval': [['3×2 mm',200,11],['3×2.5 mm',200,8.36],['3.5×2.5 mm',200,9.78],['4×2 mm',100,9.9],['4×3 mm',100,11.12],['4.5×3.5 mm',100,13.64],['5×3 mm',100,13.2],['5×4 mm',100,19.8],['6×4 mm',100,24.2],['7×5 mm',50,37.4],['8×6 mm',50,56.22],['9×6 mm',50,78.22],['9×7 mm',50,79.2],['10×7 mm',25,99],['10×8 mm',25,107.56],['11×8 mm',25,121],['11×9 mm',25,143],['12×8 mm',15,154],['12×10 mm',15,209],['14×10 mm',15,226.11],['12×9 mm',15,187]],
    'octagon-step': [['4×3 mm',200,17.6],['5×3 mm',200,24.2],['6×4 mm',100,37.4],['7×5 mm',50,57.2],['8×6 mm',50,77],['9×7 mm',25,88],['10×8 mm',25,154],['11×9 mm',15,165],['12×8 mm',15,198],['12×10 mm',15,220],['14×10 mm',15,259.6],['14×12 mm',15,347.6]],
    'octagon-princess': [['4×3 mm',200,18.7],['5×3 mm',200,16.5],['6×4 mm',100,33],['7×5 mm',50,44],['8×6 mm',50,66],['9×7 mm',25,88],['10×8 mm',25,132],['11×9 mm',15,160.6],['12×10 mm',15,220]],
    'marquise': [['3×1.5 mm',200,7.26],['4×2 mm',200,8.8],['5×2.5 mm',200,12.1],['6×3 mm',200,16.72],['7×3.5 mm',100,25.3],['8×4 mm',100,36.3],['10×5 mm',50,57.2],['12×6 mm',15,88],['14×7 mm',15,132]],
    'cushion': [['2 mm',200,6.3],['3 mm',200,13.1],['3.5 mm',200,18.9],['4 mm',200,18.7],['4.5 mm',100,24.2],['5 mm',100,29.7],['5.5 mm',50,35.2],['6 mm',50,44],['7 mm',50,66],['8 mm',50,88],['9 mm',25,106.33],['10 mm',15,176],['11 mm',15,259.11]],
    'princess': [['1.5 mm',200,4.76],['1.75 mm',200,5.24],['2 mm',200,5.95],['2.25 mm',200,6.19],['2.5 mm',200,6.8],['2.75 mm',200,9.52],['3 mm',200,12.38],['3.25 mm',200,14.03],['3.5 mm',200,15.58],['4 mm',100,18.7],['4.5 mm',100,20.9],['5 mm',50,29.7],['5.5 mm',50,34.1],['6 mm',50,44],['7 mm',50,63.8],['8 mm',25,83.6],['9 mm',25,110],['10 mm',15,143]],
    'baguette': [['1.5×1 mm',200,9.9],['2×1 mm',200,9.9],['2×1.5 mm',200,9.9],['2.3×1.5 mm',200,9.9],['2.5×1.5 mm',200,9.24],['3×1.5 mm',200,9.24],['3×2 mm',200,9.9],['4×2 mm',200,12.1],['5×2.5 mm',200,18.94],['4×3 mm',200,16.62],['6×3 mm',100,21.52],['6×4 mm',100,24.2],['7×5 mm',50,46.2],['8×5 mm',50,66],['8×6 mm',50,70.4]],
    'heart': [['3 mm',200,12.87],['4 mm',100,20.9],['5 mm',100,30.8],['6 mm',100,55],['7 mm',100,79.2],['8 mm',50,101.2],['9 mm',25,127.6],['10 mm',25,154],['11 mm',25,242],['12 mm',25,319],['13 mm',25,501.6],['14 mm',25,715],['15 mm',25,979]],
    'triangle': [['3 mm',200,11.44],['3.5 mm',100,15.4],['4 mm',100,20.9],['5 mm',50,28.6],['6 mm',25,50.6],['7 mm',25,72.6],['8 mm',25,92.4],['9 mm',25,114.4],['10 mm',25,165],['11 mm',25,242],['12 mm',25,286]],
    'trillion': [['3 mm',200,13.2],['4 mm',200,18.7],['5 mm',100,29.7],['6 mm',50,44],['7 mm',50,77],['8 mm',50,88],['9 mm',25,127.11],['10 mm',15,176]],
    'asscher': [['4 mm',200,23.1]],
    'hexagon': [['3 mm',200,14.96],['4 mm',200,37.4],['5 mm',100,52.8],['6 mm',50,54.51]],
    'star': [['4 mm',200,25.67],['5 mm',100,33]],
    'oblong-cushion': [['6×4 mm',100,40.33],['7×5 mm',50,51.33],['8×6 mm',50,73.33],['9×7 mm',50,95.33],['10×8 mm',25,143],['12×10 mm',15,275],['14×10 mm',15,374]],
  },
  'excele|green': {
    'pear': [['3×2 mm',200,7.7],['3×2.5 mm',200,8.36],['3.5×2.5 mm',200,8.8],['4×3 mm',100,9.9],['4.5×3.5 mm',100,13.64],['5×3 mm',100,13.2],['5×4 mm',100,22],['6×4 mm',100,24.2],['7×5 mm',50,33],['8×5 mm',50,48.4],['8×6 mm',50,55],['9×6 mm',50,73.33],['9×7 mm',50,77],['10×7 mm',25,110],['10×8 mm',25,99],['11×8 mm',25,143],['11×9 mm',25,209],['12×8 mm',15,134.44],['12×10 mm',15,242],['13×9 mm',15,209],['14×10 mm',15,242],['10×15 mm',15,286]],
    'oval': [['3×2 mm',200,7.7],['3×2.5 mm',200,8.36],['3.5×2.5 mm',200,8.8],['4×3 mm',100,9.9],['4.5×3.5 mm',100,13.64],['5×3 mm',100,13.2],['5×4 mm',100,22],['6×4 mm',100,24.2],['7×5 mm',50,33],['8×5 mm',50,48.4],['8×6 mm',50,55],['9×6 mm',50,73.33],['9×7 mm',50,77],['10×7 mm',25,110],['10×8 mm',25,99],['11×8 mm',25,143],['11×9 mm',25,209],['12×8 mm',15,134.44],['12×10 mm',15,242],['13×9 mm',15,209],['14×10 mm',15,242],['10×15 mm',15,286]],
    'round': [['0.80 mm',1000,1.42],['0.90 mm',1000,1.42],['1.00 mm',1000,1.42],['1.10 mm',1000,1.42],['1.20 mm',1000,1.42],['1.30 mm',1000,1.52],['1.40 mm',1000,1.62],['1.50 mm',1000,1.72],['1.60 mm',1000,2.22],['1.70 mm',1000,2.23],['1.80 mm',1000,2.63],['1.90 mm',1000,2.79],['2.00 mm',1000,3],['2.10 mm',500,3.34],['2.20 mm',500,3.64],['2.30 mm',500,4.25],['2.40 mm',500,4.76],['2.50 mm',500,5.06],['2.60 mm',500,5.57],['2.70 mm',500,6.07],['2.80 mm',500,6.88],['2.90 mm',500,7.29],['3.00 mm',500,7.49],['3.10 mm',200,8.1],['3.20 mm',200,8.7],['3.25 mm',200,9.11],['3.30 mm',200,9.72],['3.40 mm',200,10.52],['3.50 mm',200,12.04],['3.60 mm',200,12.04],['3.70 mm',200,12.75],['3.75 mm',200,13.16],['3.80 mm',200,13.76],['3.90 mm',200,14.57],['4.00 mm',200,15.79],['4.25 mm',100,16.5],['4.50 mm',100,18.7],['4.75 mm',100,22],['5.00 mm',100,24.2],['5.25 mm',50,27.5],['5.50 mm',50,30.8],['5.75 mm',50,35.2],['6.00 mm',50,39.6],['6.25 mm',50,44],['6.50 mm',50,52.8],['6.75 mm',50,52.8],['7.00 mm',50,55],['7.25 mm',50,61.6],['7.50 mm',50,68.2],['7.75 mm',50,74.8],['8.00 mm',50,79.2],['8.25 mm',50,85.8],['8.50 mm',50,94.6],['8.75 mm',50,101.2],['9.00 mm',50,105.6],['9.50 mm',50,121],['10.00 mm',50,143],['11.00 mm',50,220],['12.00 mm',50,297],['13.00 mm',50,330],['14.00 mm',50,407],['15.00 mm',50,495]],
    'marquise': [['3×1.5 mm',200,7.26],['4×2 mm',200,9.9],['5×2.5 mm',200,11],['6×3 mm',200,16.5],['7×3.5 mm',100,25.3],['8×4 mm',100,33],['10×5 mm',50,57.2],['12×6 mm',15,88]],
    'princess': [['1.5 mm',200,4.84],['1.75 mm',200,5.19],['2 mm',200,5.5],['2.25 mm',200,6.05],['2.5 mm',200,8.6],['2.75 mm',200,11.22],['3 mm',200,13.2],['3.25 mm',200,13.75],['3.5 mm',200,13.86],['4 mm',100,18.7],['4.5 mm',100,22],['5 mm',50,28.72],['5.5 mm',50,37.4],['6 mm',50,44],['6.5 mm',50,55],['7 mm',50,63.8],['7.5 mm',50,74.8],['8 mm',25,83.6],['9 mm',25,105.6],['10 mm',15,143],['11 mm',15,220],['12 mm',15,287.22]],
    'octagon-princess': [['4×3 mm',200,15.4],['5×3 mm',200,16.5],['6×4 mm',100,33],['7×5 mm',50,38.23],['8×6 mm',50,59.26],['9×7 mm',25,78.37],['10×8 mm',25,99.4],['11×9 mm',15,129.99],['12×10 mm',15,191.16]],
    'baguette': [['1.5×1 mm',200,9.9],['2×1 mm',200,9.9],['2.5×1.5 mm',200,9.9],['3×1.5 mm',200,9.9],['3×2 mm',200,11.66],['4×2 mm',200,12.1],['4×3 mm',200,16.62],['5×2.5 mm',200,15.4],['6×3 mm',100,20.9],['6×4 mm',100,35.2],['7×5 mm',50,46.2],['8×5 mm',50,66],['8×6 mm',50,70.4]],
    'heart': [['3 mm',200,12.16],['4 mm',100,18.7],['5 mm',100,27.63],['6 mm',100,49.87],['7 mm',100,71.06],['8 mm',50,94.11],['9 mm',25,114.4],['10 mm',25,137.13],['11 mm',25,218.17],['12 mm',25,280.5],['13 mm',25,469.58],['14 mm',25,639.96],['15 mm',25,878.9]],
    'triangle': [['2 mm',200,5.75],['3 mm',200,10.08],['4 mm',100,19.15],['5 mm',50,27.22],['6 mm',25,38.3],['7 mm',25,77],['8 mm',25,76.61],['9 mm',25,111.08],['10 mm',25,153.22]],
    'cushion': [['3 mm',200,10.8],['4 mm',200,17.66],['5 mm',100,28.05],['6 mm',50,49.5],['7 mm',50,62.33],['8 mm',50,90.44],['9 mm',25,143],['10 mm',15,166.22]],
    'asscher': [['3 mm',200,13.2],['3.25 mm',200,15.4],['3.5 mm',200,18.7],['3.75 mm',200,20.24],['4 mm',200,22],['4.25 mm',100,25.3],['4.5 mm',100,28.6],['4.75 mm',100,30.8],['5 mm',100,34.76],['5.25 mm',50,37.4],['5.5 mm',50,40.7],['5.75 mm',50,46.2],['6 mm',50,55],['6.25 mm',50,57.2],['6.5 mm',50,63.8],['6.75 mm',50,68.2],['7 mm',50,77],['7.25 mm',25,82.5],['7.5 mm',25,88],['7.75 mm',25,93.5],['8 mm',25,99],['8.25 mm',25,107.8],['8.5 mm',25,118.8],['8.75 mm',25,125.4],['9 mm',25,132],['10 mm',25,176]],
    'hexagon': [['3 mm',200,14.96],['4 mm',200,37.4],['5 mm',100,52.8],['6 mm',50,56.34]],
  },
  'excele|tanzanite': {
    'pear': [['3×2 mm',200,8.8],['3×2.5 mm',200,8.36],['3.5×2.5 mm',200,13.2],['4×3 mm',100,10.45],['4.5×3.5 mm',100,13.64],['5×3 mm',100,13.93],['5×4 mm',100,22],['6×4 mm',100,25.54],['7×5 mm',50,33],['8×5 mm',50,48.4],['8×6 mm',50,55],['9×6 mm',50,73.33],['9×7 mm',50,77],['10×7 mm',25,104.62],['10×8 mm',25,99],['11×8 mm',25,143],['11×9 mm',25,209],['12×8 mm',15,154],['12×10 mm',15,242],['13×9 mm',15,209],['14×10 mm',15,242],['10×15 mm',15,286]],
    'oval': [['3×2 mm',200,8.8],['3×2.5 mm',200,8.36],['3.5×2.5 mm',200,13.2],['4×3 mm',100,10.45],['4.5×3.5 mm',100,13.64],['5×3 mm',100,13.93],['5×4 mm',100,22],['6×4 mm',100,25.54],['7×5 mm',50,33],['8×5 mm',50,48.4],['8×6 mm',50,55],['9×6 mm',50,73.33],['9×7 mm',50,77],['10×7 mm',25,104.62],['10×8 mm',25,99],['11×8 mm',25,143],['11×9 mm',25,209],['12×8 mm',15,154],['12×10 mm',15,242],['13×9 mm',15,209],['14×10 mm',15,242],['10×15 mm',15,286]],
    'round': [['0.80 mm',1000,1.58],['0.90 mm',1000,1.54],['1.00 mm',1000,1.32],['1.10 mm',1000,1.43],['1.20 mm',1000,1.5],['1.30 mm',1000,1.54],['1.40 mm',1000,1.58],['1.50 mm',1000,1.65],['1.60 mm',1000,1.87],['1.70 mm',1000,2.2],['1.80 mm',1000,2.42],['1.90 mm',1000,2.64],['2.00 mm',1000,2.97],['2.10 mm',500,4.18],['2.20 mm',500,3.74],['2.30 mm',500,3.74],['2.40 mm',500,5.5],['2.50 mm',500,4.4],['2.60 mm',500,4.95],['2.70 mm',500,5.72],['2.80 mm',500,5.72],['2.90 mm',500,6.38],['3.00 mm',500,6.6],['3.10 mm',200,7.7],['3.20 mm',200,8.36],['3.25 mm',200,8.8],['3.30 mm',200,9.24],['3.40 mm',200,9.9],['3.50 mm',200,11],['3.60 mm',200,11.44],['3.70 mm',200,12.32],['3.75 mm',200,12.76],['3.80 mm',200,13.86],['3.90 mm',200,13.86],['4.00 mm',200,14.52],['4.25 mm',100,19.04],['4.50 mm',100,20.44],['4.75 mm',100,22],['5.00 mm',100,25.54],['5.25 mm',50,27.5],['5.50 mm',50,32.51],['5.75 mm',50,35.2],['6.00 mm',50,44],['6.25 mm',50,44],['6.50 mm',50,48.4],['6.75 mm',50,52.8],['7.00 mm',50,58.06],['7.25 mm',50,61.6],['7.50 mm',50,68.2],['7.75 mm',50,74.8],['8.00 mm',50,79.2],['8.25 mm',50,85.8],['8.50 mm',50,94.6],['8.75 mm',50,101.2],['9.00 mm',50,105.6],['9.50 mm',50,121],['10.00 mm',50,143],['11.00 mm',50,220],['12.00 mm',50,297],['13.00 mm',50,330],['14.00 mm',50,407],['15.00 mm',50,495]],
    'marquise': [['3×1.5 mm',200,7.26],['3×2 mm',200,8.13],['4×2 mm',200,8.8],['5×2.5 mm',200,11],['6×3 mm',200,16.5],['7×3.5 mm',100,25.3],['8×4 mm',100,38.32],['10×5 mm',50,57.2],['12×6 mm',15,88]],
    'princess': [['1.5 mm',200,4.84],['1.75 mm',200,5.19],['2 mm',200,5.5],['2.25 mm',200,6.05],['2.5 mm',200,7.11],['2.75 mm',200,8.49],['3 mm',200,10.65],['3.25 mm',200,12.53],['3.5 mm',200,13.86],['3.75 mm',100,16.81],['4 mm',100,19.74],['4.25 mm',100,20.9],['4.5 mm',100,23.22],['5 mm',50,28.72],['5.5 mm',50,37.4],['6 mm',50,46.44],['6.5 mm',50,55],['7 mm',50,66],['7.5 mm',50,74.8],['8 mm',25,88],['9 mm',25,105.6],['10 mm',15,143],['12 mm',15,287.22]],
    'octagon-princess': [['4×3 mm',200,13.2],['5×3 mm',200,14.34],['6×4 mm',100,33],['7×5 mm',50,38.23],['8×6 mm',50,69.67],['9×7 mm',25,78.37],['10×8 mm',25,99.4],['11×9 mm',15,129.99],['12×10 mm',15,191.16]],
    'baguette': [['1.5×1 mm',200,9.9],['2×1 mm',200,9.9],['2.5×1.5 mm',200,9.9],['2.7×1.5 mm',200,11],['3×1.5 mm',200,9.9],['3×2 mm',200,12.1],['3.25×1.5 mm',200,11],['3.5×1.5 mm',200,11],['4×2 mm',200,12.1],['5×2.5 mm',200,15.4],['6×3 mm',100,17.11],['6×4 mm',100,35.2],['7×5 mm',50,46.2],['8×5 mm',50,66],['8×6 mm',50,66]],
    'heart': [['3 mm',200,12.1],['4 mm',100,18.7],['5 mm',100,33],['6 mm',100,49.87],['7 mm',100,71.06],['8 mm',50,94.11],['9 mm',25,114.4],['10 mm',25,154],['11 mm',25,218.17],['12 mm',25,280.5],['13 mm',25,469.58],['14 mm',25,639.96],['15 mm',25,878.9]],
    'triangle': [['2 mm',200,5.75],['3 mm',200,10.08],['4 mm',100,19.15],['5 mm',50,27.22],['6 mm',25,38.3],['7 mm',25,57.46],['8 mm',25,76.61],['9 mm',25,111.08],['10 mm',25,153.22]],
    'cushion': [['3 mm',200,10.8],['4 mm',200,17.66],['5 mm',100,31.78],['6 mm',50,46.44],['7 mm',50,62.33],['8 mm',50,90.44],['9 mm',25,122.22],['10 mm',15,166.22]],
    'oblong-cushion': [['6×4 mm',100,39.11],['7×5 mm',50,51.33],['8×6 mm',50,72.11],['9×7 mm',50,95.33],['10×8 mm',25,143],['12×8 mm',15,238.33],['12×10 mm',15,275],['14×10 mm',15,374]],
    'octagon-step': [['4×3 mm',200,15.4],['5×3 mm',200,16.5],['6×4 mm',100,35.2],['7×5 mm',50,55],['8×6 mm',50,72.6],['9×7 mm',25,103.4],['10×8 mm',25,122.22],['11×9 mm',15,168.67],['12×10 mm',15,242]],
    'trillion': [['3 mm',200,12.1],['4 mm',200,20.9],['5 mm',100,30.56],['6 mm',50,46.44],['7 mm',50,77],['8 mm',50,99]],
  },
  'excele|tcf': {
    'round': [['0.80 mm',1000,2.75],['0.90 mm',1000,2.75],['1.00 mm',1000,2.75],['1.10 mm',1000,2.75],['1.20 mm',1000,2.75],['1.25 mm',1000,2.75],['1.30 mm',1000,2.75],['1.40 mm',1000,2.75],['1.50 mm',1000,2.75],['1.60 mm',1000,2.75],['1.70 mm',1000,2.8],['1.75 mm',1000,2.8],['1.80 mm',1000,2.8],['1.90 mm',1000,3.2],['2.00 mm',1000,3.4],['2.10 mm',500,3.6],['2.20 mm',500,4.2],['2.25 mm',500,4.6],['2.30 mm',500,5],['2.40 mm',500,5.2],['2.50 mm',500,5.2],['2.60 mm',500,6],['2.70 mm',500,6.8],['2.75 mm',500,7],['2.80 mm',500,7.6],['2.90 mm',500,8],['3.00 mm',500,8.6],['3.25 mm',200,10.6],['3.50 mm',200,13],['3.75 mm',200,15.6],['4.00 mm',200,18.2],['4.25 mm',200,20.8],['4.50 mm',200,23.4],['4.75 mm',100,26],['5.00 mm',100,26],['5.25 mm',100,35],['5.50 mm',100,37.6],['5.75 mm',100,40.2],['6.00 mm',100,41.6],['6.25 mm',100,49.4],['6.50 mm',100,49.4],['6.75 mm',100,56.2],['7.00 mm',100,57.2],['7.50 mm',50,62.4],['8.00 mm',50,78],['8.50 mm',50,85.8],['9.00 mm',50,93.6],['10.00 mm',50,124.8]],
    'oval': [['2×3 mm',100,12.2],['2×4 mm',100,15.6],['3×4 mm',100,15.6],['3×5 mm',100,18.2],['4×5 mm',100,23.4],['4×6 mm',100,26],['5×7 mm',50,39],['5×8 mm',50,52],['6×8 mm',50,57.2],['6×9 mm',50,78],['7×9 mm',50,80.6],['7×10 mm',25,91],['7×12 mm',25,143],['8×10 mm',25,101.4]],
    'pear': [['2×3 mm',100,12.2],['2×4 mm',100,15.6],['3×4 mm',100,15.6],['3×5 mm',100,18.2],['4×5 mm',100,23.4],['4×6 mm',100,26],['5×7 mm',50,39],['5×8 mm',50,52],['6×8 mm',50,57.2],['6×9 mm',50,78],['7×9 mm',50,80.6],['7×10 mm',25,91],['7×12 mm',25,143],['8×10 mm',25,101.4]],
    'marquise': [['1.5×3 mm',200,7.2],['2×3 mm',200,9],['2×4 mm',200,9],['2.5×5 mm',100,14.2],['3×4 mm',100,14.2],['3×5 mm',100,19.4],['3×6 mm',100,20.8],['3.5×7 mm',100,26],['4×6 mm',50,26],['4×8 mm',50,36.4],['5×7 mm',50,41.6],['5×10 mm',50,70.2],['6×8 mm',50,62.4],['6×11 mm',50,88.4],['6×12 mm',50,93.6],['7×9 mm',50,80.6],['7×14 mm',25,130],['8×10 mm',25,101.4]],
    'baguette': [['1.5×3 mm',200,7.2],['2×3 mm',200,9],['2×4 mm',200,9],['2.5×5 mm',100,14.2],['3×4 mm',100,14.2],['3×5 mm',100,19.4],['3×6 mm',100,20.8],['3.5×7 mm',100,26],['4×6 mm',50,26],['4×8 mm',50,36.4],['5×7 mm',50,41.6],['5×10 mm',50,70.2],['6×8 mm',50,62.4],['6×11 mm',50,88.4],['6×12 mm',50,93.6],['7×9 mm',50,80.6],['7×14 mm',25,130],['8×10 mm',25,101.4]],
    'octagon-step': [['1.5×3 mm',200,7.2],['2×3 mm',200,9],['2×4 mm',200,9],['2.5×5 mm',100,14.2],['3×4 mm',100,14.2],['3×5 mm',100,19.4],['3×6 mm',100,20.8],['3.5×7 mm',100,26],['4×6 mm',50,26],['4×8 mm',50,36.4],['5×7 mm',50,41.6],['5×10 mm',50,70.2],['6×8 mm',50,62.4],['6×11 mm',50,88.4],['6×12 mm',50,93.6],['7×9 mm',50,80.6],['7×14 mm',25,130],['8×10 mm',25,101.4]],
    'princess': [['1.5 mm',200,5.2],['1.75 mm',200,6.4],['2 mm',200,8.6],['2.25 mm',200,9],['2.5 mm',200,9.8],['2.75 mm',100,11.6],['3 mm',100,11.6],['3.25 mm',100,15],['3.5 mm',100,18.2],['3.75 mm',100,19.4],['4 mm',100,20.8],['4.5 mm',50,28.6],['5 mm',50,31.2],['6 mm',50,46.8],['7 mm',25,72.8],['8 mm',25,83.2]],
    'heart': [['1.5 mm',200,5.2],['1.75 mm',200,6.4],['2 mm',200,8.6],['2.25 mm',200,9],['2.5 mm',200,9.8],['2.75 mm',100,11.6],['3 mm',100,11.6],['3.25 mm',100,15],['3.5 mm',100,18.2],['3.75 mm',100,19.4],['4 mm',100,20.8],['4.5 mm',50,28.6],['5 mm',50,31.2],['6 mm',50,46.8],['7 mm',25,72.8],['8 mm',25,83.2]],
    'triangle': [['1.5 mm',200,5.2],['1.75 mm',200,6.4],['2 mm',200,8.6],['2.25 mm',200,9],['2.5 mm',200,9.8],['2.75 mm',100,11.6],['3 mm',100,11.6],['3.25 mm',100,15],['3.5 mm',100,18.2],['3.75 mm',100,19.4],['4 mm',100,20.8],['4.5 mm',50,28.6],['5 mm',50,31.2],['6 mm',50,46.8],['7 mm',25,72.8],['8 mm',25,83.2]],
    'trillion': [['1.5 mm',200,5.2],['1.75 mm',200,6.4],['2 mm',200,8.6],['2.25 mm',200,9],['2.5 mm',200,9.8],['2.75 mm',100,11.6],['3 mm',100,11.6],['3.25 mm',100,15],['3.5 mm',100,18.2],['3.75 mm',100,19.4],['4 mm',100,20.8],['4.5 mm',50,28.6],['5 mm',50,31.2],['6 mm',50,46.8],['7 mm',25,72.8],['8 mm',25,83.2]],
    'star': [['1.5 mm',200,5.2],['1.75 mm',200,6.4],['2 mm',200,8.6],['2.25 mm',200,9],['2.5 mm',200,9.8],['2.75 mm',100,11.6],['3 mm',100,11.6],['3.25 mm',100,15],['3.5 mm',100,18.2],['3.75 mm',100,19.4],['4 mm',100,20.8],['4.5 mm',50,28.6],['5 mm',50,31.2],['6 mm',50,46.8],['7 mm',25,72.8],['8 mm',25,83.2]],
  },
  'excele|purple': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'excele|inkblue': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'excele|pink': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'excele|yellow': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'excele|garnet': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'excele|olive': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'excele|black': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'excele|champagne': {
    'round': [['0.80 mm',1000,0.88],['0.90 mm',1000,0.78],['1.00 mm',1000,0.65],['1.10 mm',1000,0.65],['1.15 mm',1000,0.7],['1.20 mm',1000,0.7],['1.25 mm',1000,0.7],['1.30 mm',1000,0.7],['1.40 mm',1000,0.78],['1.50 mm',1000,0.78],['1.60 mm',1000,0.9],['1.70 mm',1000,1.03],['1.75 mm',1000,1.07],['1.80 mm',1000,1.07],['1.90 mm',1000,1.27],['2.00 mm',1000,1.27],['2.10 mm',500,1.43],['2.20 mm',500,1.43],['2.30 mm',500,1.55],['2.40 mm',500,1.55],['2.50 mm',500,1.55],['2.60 mm',500,1.88],['2.70 mm',500,1.88],['2.80 mm',500,2],['2.90 mm',500,2],['3.00 mm',500,2],['3.20 mm',200,3.12],['3.25 mm',200,2.3],['3.50 mm',200,3.12],['3.75 mm',200,4],['4.00 mm',200,4],['4.25 mm',100,5.75],['4.50 mm',100,6.25],['4.75 mm',100,8.25],['5.00 mm',100,8.25],['5.25 mm',50,9.25],['5.50 mm',50,9.25],['5.75 mm',50,12.25],['6.00 mm',50,12.25],['6.25 mm',50,14.25],['6.50 mm',50,15],['6.75 mm',50,15],['7.00 mm',50,15],['7.25 mm',50,31.25],['7.50 mm',50,19.75],['8.00 mm',50,21.25],['9.00 mm',50,40],['10.00 mm',50,48.25],['11.00 mm',50,57.5],['12.00 mm',50,71.25]],
    'oval': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'pear': [['3×2 mm',200,2],['3×2.5 mm',200,3.38],['4×3 mm',100,3.38],['5×3 mm',100,4],['5×4 mm',100,7],['6×4 mm',100,7.5],['7×5 mm',50,12],['8×6 mm',50,20.75],['9×7 mm',50,26.75],['10×8 mm',25,39.5],['11×9 mm',25,50.75],['12×8 mm',15,48],['12×10 mm',15,65],['16×12 mm',15,113],['18×13 mm',15,141.25]],
    'marquise': [['3×1.5 mm',200,1.45],['4×2 mm',200,1.7],['5×2.5 mm',200,2.88],['6×3 mm',200,4],['7×3.5 mm',100,8.5],['8×4 mm',100,11.25],['10×5 mm',50,19.75],['12×6 mm',15,39.5],['14×7 mm',15,48],['16×8 mm',15,73.5]],
    'princess': [['2 mm',200,1.82],['2.5 mm',200,2.12],['3 mm',200,3.44],['3.5 mm',200,4.5],['4 mm',100,7],['4.5 mm',100,8.5],['5 mm',50,10.75],['6 mm',50,17],['6.5 mm',50,24],['7 mm',50,25.5],['7.5 mm',50,43.75],['8 mm',25,34],['9 mm',25,48],['10 mm',15,62.25]],
    'cushion': [['2 mm',200,4.25],['3 mm',200,5.75],['4 mm',200,10],['5 mm',100,11.25],['6 mm',50,17],['7 mm',50,25.5],['8 mm',50,34],['9 mm',25,48],['10 mm',15,65]],
    'heart': [['3 mm',200,4.25],['3.5 mm',100,5],['4 mm',100,5.75],['4.5 mm',100,10.75],['5 mm',100,11.25],['5.5 mm',100,14.25],['6 mm',100,17],['7 mm',100,25.5],['8 mm',50,9],['9 mm',25,48],['10 mm',25,65],['11 mm',25,84.75],['12 mm',25,99]],
    'triangle': [['3 mm',200,3.75],['3.5 mm',100,5.75],['4 mm',100,6.5],['4.5 mm',50,8.5],['5 mm',50,9.25],['6 mm',25,15.5],['7 mm',25,16.25],['8 mm',25,36.75]],
    'oblong-cushion': [['5×3 mm',100,7],['6×4 mm',100,10],['7×5 mm',50,15.5],['8×6 mm',50,24],['9×7 mm',50,34],['10×8 mm',25,45.25]],
    'octagon-step': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,25.5],['7×9 mm',25,36.75],['8×10 mm',25,48]],
    'octagon-princess': [['3×5 mm',200,7],['4×6 mm',100,10],['5×7 mm',50,15.5],['6×8 mm',50,24],['7×9 mm',25,34],['8×10 mm',25,45.25]],
  },
  'deccan|purple': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
  'deccan|inkblue': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
  'deccan|pink': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
  'deccan|yellow': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
  'deccan|garnet': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
  'deccan|olive': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
  'deccan|black': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
  'deccan|champagne': {
    'round': [['0.80 mm',1000,0.3],['0.90 mm',1000,0.3],['1.00 mm',1000,0.3],['1.10 mm',1000,0.3],['1.20 mm',1000,0.3],['1.25 mm',1000,0.3],['1.30 mm',1000,0.3],['1.40 mm',1000,0.3],['1.50 mm',1000,0.35],['1.60 mm',1000,0.38],['1.70 mm',1000,0.42],['1.75 mm',1000,0.42],['1.80 mm',1000,0.43],['1.90 mm',1000,0.45],['2.00 mm',1000,0.45],['2.10 mm',500,0.5],['2.20 mm',500,0.62],['2.25 mm',500,0.62],['2.30 mm',500,0.66],['2.40 mm',500,0.71],['2.50 mm',500,0.81],['2.60 mm',500,0.87],['2.70 mm',500,0.94],['2.75 mm',500,0.98],['2.80 mm',500,0.98],['2.90 mm',500,1.09],['3.00 mm',500,1.17],['3.10 mm',200,1.39],['3.20 mm',200,1.39],['3.25 mm',200,1.39],['3.30 mm',200,1.47],['3.50 mm',200,1.47],['3.75 mm',200,1.54],['4.00 mm',200,2.1],['4.25 mm',200,2.94],['4.50 mm',200,3.33],['4.75 mm',200,3.64],['5.00 mm',100,3.64],['5.25 mm',100,7.28],['5.50 mm',100,5.32],['5.75 mm',100,6.93],['6.00 mm',100,6.16],['6.25 mm',100,14],['6.50 mm',100,10.1],['6.75 mm',100,14],['7.00 mm',100,9.24],['7.25 mm',100,20.61],['7.50 mm',100,11.76],['7.75 mm',50,26.44],['8.00 mm',50,12.6],['8.25 mm',50,29.94],['8.50 mm',50,19.6],['8.75 mm',50,34.22],['9.00 mm',50,17.64],['9.25 mm',50,39.2],['9.50 mm',50,24.89],['9.75 mm',50,45.11],['10.00 mm',50,22.4],['10.25 mm',25,49.78],['10.75 mm',25,59.11],['11.00 mm',25,32.2],['12.00 mm',25,43.4],['13.00 mm',25,56],['14.00 mm',25,64.4],['15.00 mm',25,92.4],['16.00 mm',15,100.8],['17.00 mm',15,168],['18.00 mm',15,182],['20.00 mm',15,266]],
    'princess': [['1.5 mm',1000,2.5],['1.75 mm',500,2.5],['2 mm',1000,2.5],['2.2 mm',500,2.5],['2.25 mm',500,2.5],['2.5 mm',500,2.5],['2.6 mm',500,2.5],['2.75 mm',500,2.5],['3 mm',500,2.5],['3.5 mm',200,2.5],['4 mm',200,2.5],['4.5 mm',200,5.91],['5 mm',100,4.48],['5.5 mm',100,11.2],['6 mm',100,7],['6.5 mm',100,13.38],['7 mm',100,11.76],['7.5 mm',100,23.33],['8 mm',50,15.4],['9 mm',50,23.8],['10 mm',25,33.6],['11 mm',25,56],['12 mm',25,59.11]],
    'cushion': [['2 mm',500,7.84],['2.5 mm',500,7.84],['3 mm',200,2.66],['3.5 mm',500,9.8],['4 mm',200,5.6],['4.5 mm',200,11.76],['5 mm',100,9.78],['5.5 mm',200,11.76],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,15.56],['9 mm',50,25.12],['10 mm',25,35],['12 mm',25,48.22]],
    'trillion': [['3 mm',200,2.66],['4 mm',200,6.3],['5 mm',100,9.78],['6 mm',100,9.78],['7 mm',50,12.69],['8 mm',50,17.19],['9 mm',50,25.12],['10 mm',25,35]],
    'heart': [['2 mm',500,3.89],['3 mm',200,4.2],['3.5 mm',500,4.2],['4 mm',200,3.22],['4.5 mm',200,9.8],['5 mm',100,5.6],['5.5 mm',200,11.39],['6 mm',100,7.84],['7 mm',100,10.36],['8 mm',50,14],['9 mm',50,22.4],['10 mm',25,27.49],['11 mm',25,49.78],['12 mm',25,49.78],['14 mm',25,80.89],['15 mm',25,93.33],['16 mm',25,70],['18 mm',25,80.89]],
    'triangle': [['2 mm',500,3.36],['3 mm',500,2.52],['3.5 mm',500,2.66],['4 mm',200,2.66],['5 mm',100,4.06],['6 mm',100,7],['7 mm',50,10.64],['8 mm',50,15.4],['9 mm',50,25.2],['10 mm',25,35]],
    'asscher': [['3 mm',200,7.02],['4 mm',200,9.18],['5 mm',100,9.36],['6 mm',100,22],['7 mm',50,32],['8 mm',50,47.6],['9 mm',50,59.4],['10 mm',25,79.2],['2 mm',500,2],['2.5 mm',500,2]],
    'octagon-princess': [['4×3 mm',500,2.55],['5×3 mm',200,2.94],['6×4 mm',200,4.2],['7×5 mm',100,7],['8×6 mm',100,10.64],['9×7 mm',50,14.84],['10×8 mm',50,20.44],['11×9 mm',25,37.8],['12×10 mm',25,39.2],['14×10 mm',25,47.6],['16×12 mm',15,78.4],['5×4 mm',200,9.33],['12×9 mm',25,70],['12×8 mm',25,42],['3×1.5 mm',500,0.81],['4×2 mm',500,0.98],['5×2.5 mm',200,1.46],['6×3 mm',200,1.96],['7×3.5 mm',100,3.36],['8×4 mm',100,4.48],['9×4.5 mm',50,8.82],['10×5 mm',50,11.32],['12×6 mm',25,16.8],['14×7 mm',25,23.8],['16×8 mm',25,36.84],['4.5×2.5 mm',200,3.5]],
    'baguette': [['1.5×1 mm',200,1.05],['1.75×1 mm',500,1.15],['2×1 mm',500,1.15],['2×1.25 mm',500,1.15],['2.5×1.25 mm',500,1.2],['2×1.5 mm',500,1.2],['2.5×1.5 mm',500,1.2],['2.75×1.5 mm',500,1.4],['2.5×2 mm',500,1.4],['3×1.5 mm',500,1.15],['3.5×1.5 mm',500,2.5],['3×2 mm',500,2.5],['3.5×2 mm',500,2.5],['4×2 mm',500,2.5],['5×2.5 mm',200,2.5],['4×3 mm',500,3.65],['5×3 mm',200,5.37],['6×3 mm',200,8.4],['7×5 mm',100,14],['8×4 mm',200,13.1]],
    'star': [['3 mm',200,2.38],['4 mm',200,5.04],['5 mm',100,6.6],['6 mm',100,7.93],['7 mm',50,14.19],['8 mm',50,14.54],['9 mm',50,23.8],['10 mm',25,27.77],['12 mm',25,47.6],['14 mm',25,92.4],['16 mm',25,98]],
  },
};
// Which shapes each grade+colour actually prices (keep exactly what's in the file).
const CZ_SHAPES_BY_KEY = {
  'excele|rhodolite': ['oval','pear','round','marquise','octagon-princess','baguette'],
  'excele|brown': ['oval','pear','round','octagon-princess','marquise','cushion','baguette','asscher'],
  'excele|aqua': ['round','pear','oval','octagon-step','octagon-princess','marquise','cushion','princess','baguette','heart','triangle','trillion','asscher','hexagon','star','oblong-cushion'],
  'excele|green': ['pear','oval','round','marquise','princess','octagon-princess','baguette','heart','triangle','cushion','asscher','hexagon'],
  'excele|tanzanite': ['pear','oval','round','marquise','princess','octagon-princess','baguette','heart','triangle','cushion','oblong-cushion','octagon-step','trillion'],
  'excele|tcf': ['round','oval','pear','marquise','baguette','octagon-step','princess','heart','triangle','trillion','star'],
  'excele|purple': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'excele|inkblue': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'excele|pink': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'excele|yellow': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'excele|garnet': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'excele|olive': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'excele|black': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'excele|champagne': ['round','oval','pear','marquise','princess','cushion','heart','triangle','oblong-cushion','octagon-step','octagon-princess'],
  'deccan|purple': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
  'deccan|inkblue': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
  'deccan|pink': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
  'deccan|yellow': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
  'deccan|garnet': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
  'deccan|olive': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
  'deccan|black': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
  'deccan|champagne': ['round','princess','cushion','trillion','heart','triangle','asscher','octagon-princess','baguette','star'],
};
// Normalise a colour id to its sheet key: strip any sub-shade suffix
// (e.g. 'aqua-aqua37' → 'aqua'); other cz colour ids have no '-'.
function colorCzKey(gradeId, colorId) {
  const base = String(colorId || '').split('-')[0];
  return gradeId + '|' + base;
}
function colorCzSizes(gradeId, colorId, shape) {
  const g = CZ_SHEETS[colorCzKey(gradeId, colorId)];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function colorCzSku(gradeId, colorId, shape, size) {
  const g = CZ_SHEETS[colorCzKey(gradeId, colorId)];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'cz-' + colorCzKey(gradeId, colorId) + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
function colorCzShapes(gradeId, colorId) {
  return CZ_SHAPES_BY_KEY[colorCzKey(gradeId, colorId)] || null;
}
window.colorCzSizes = colorCzSizes;
window.colorCzSku = colorCzSku;
window.colorCzShapes = colorCzShapes;

// Opaque · Opal-look Pastel stones — one shared price table across all 8 opal
// colours (the sheet lists the colour codes but a single rate applies to all).
// Row: [size, pcs/box, ₹/piece]; packing comes straight from the sheet.
const OPAQUE_SHEETS = {
  'opal': {
    'round': [['0.80 mm',1000,0.64],['0.90 mm',1000,0.54],['1.00 mm',1000,0.54],['1.10 mm',1000,0.56],['1.20 mm',1000,0.66],['1.25 mm',1000,0.7],['1.30 mm',1000,0.8],['1.40 mm',1000,0.9],['1.50 mm',1000,0.96],['1.60 mm',1000,1.16],['1.70 mm',1000,1.4],['1.75 mm',1000,1.6],['1.80 mm',1000,1.8],['1.90 mm',1000,1.9],['2.00 mm',1000,2],['2.10 mm',500,2.5],['2.25 mm',500,2.9],['2.50 mm',500,3.6],['2.75 mm',500,4.4],['3.00 mm',500,5.6]],
    'oval': [['3×2 mm',200,4.4],['4×3 mm',200,7.6],['5×3 mm',200,9],['6×4 mm',200,13.6],['7×5 mm',100,23],['8×6 mm',100,35.6]],
    'princess': [['2 mm',200,2.2],['3 mm',200,3.8],['4 mm',100,10],['5 mm',100,15],['6 mm',100,36]],
    'marquise': [['3×1.5 mm',200,3.6],['4×2 mm',200,4.6],['5×2.5 mm',200,6.2]],
    'pear': [['3×2 mm',200,4.4],['4×3 mm',200,7.6],['5×3 mm',200,9],['6×4 mm',200,13.6],['7×5 mm',100,23],['8×6 mm',100,35.6]],
  },
};
function opaqueSizes(gradeId, shape) {
  const g = OPAQUE_SHEETS[gradeId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function opaqueSku(gradeId, shape, size) {
  const g = OPAQUE_SHEETS[gradeId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'opq-' + gradeId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.opaqueSizes = opaqueSizes;
window.opaqueSku = opaqueSku;

// Opaque · Natural-look — per-size ₹/ct rates (carat-lot pricing), per grade+colour.
// Row: [size, ₹/ct]. The 100-ct lot MOQ is applied by the pad. Round's tiny 'per-pc'
// sizes are converted to an equivalent ₹/ct so every size prices on one basis.
const OPAQUE_NAT_SHEETS = {
  'natural|red': {
    'oval': [['3×2 mm',28.16],['3×2.5 mm',23.1],['3.25×2.25 mm',22.66],['3.5×2.5 mm',20.46],['3.75×2.75 mm',20.46],['4×3 mm',19.58],['5×3 mm',19.58],['4.25×3.25 mm',19.58],['4.5×3.5 mm',19.14],['4.75×3.75 mm',19.14],['5×4 mm',18.7],['5.25×4.25 mm',18.04],['5.5×4.50 mm',18.04],['5.75×4.75 mm',18.04],['6×4 mm',18.04],['6.5×4.5 mm',16.94],['6×5 mm',16.94],['6.5×5.5 mm',16.94],['7×5 mm',16.94],['7.5×5.5 mm',16.5],['8×6 mm',16.5],['9×7 mm',16.5],['12×10 mm',16.5]],
    'pear': [['3×2 mm',28.16],['3×2.5 mm',23.1],['3.25×2.25 mm',22.66],['3.5×2.5 mm',20.46],['3.75×2.75 mm',20.46],['4×3 mm',19.58],['5×3 mm',19.58],['4.25×3.25 mm',19.58],['4.5×3.5 mm',19.14],['4.75×3.75 mm',19.14],['5×4 mm',18.7],['5.25×4.25 mm',18.04],['5.5×4.50 mm',18.04],['5.75×4.75 mm',18.04],['6×4 mm',18.04],['6.5×4.5 mm',16.94],['6×5 mm',16.94],['6.5×5.5 mm',16.94],['7×5 mm',16.94],['7.5×5.5 mm',16.5],['8×6 mm',16.5],['9×7 mm',16.5],['12×10 mm',16.5]],
    'marquise': [['3×1.5 mm',29.7],['3.5×1.75 mm',28.6],['3×2 mm',27.94],['3.5×2 mm',26.4],['4×2 mm',23.1],['4.25×2.25 mm',22.66],['4×2.5 mm',22],['4.5×2 mm',22],['4.5×2.5 mm',20.46],['5×2.5 mm',19.8],['5.5×2.75 mm',19.36],['5×3 mm',19.36],['6×3 mm',18.7],['7×3.5 mm',18.7],['8×4 mm',18.7],['10×5 mm',18.04]],
    'round': [['1.00 mm',22],['1.10 mm',22],['1.20 mm',22],['1.30 mm',22],['1.40 mm',22],['1.50 mm',22],['1.60 mm',22],['1.70 mm',22.44],['1.80 mm',22.44],['1.90 mm',22.44],['2.00 mm',22.44],['2.10 mm',20.02],['2.20 mm',20.02],['2.30 mm',20.02],['2.40 mm',20.02],['2.50 mm',20.02],['2.60 mm',20.02],['2.70 mm',20.02],['2.80 mm',20.02],['2.90 mm',20.02],['3.00 mm',20.02],['3.10 mm',18.7],['3.20 mm',18.7],['3.30 mm',18.7],['3.40 mm',18.7],['3.50 mm',18.7],['3.60 mm',18.7],['3.70 mm',18.7],['3.80 mm',18.7],['3.90 mm',18.7],['4.00 mm',18.7],['4.25 mm',17.6],['4.50 mm',17.6],['4.75 mm',17.6],['5.00 mm',17.6],['5.25 mm',17.16],['5.50 mm',17.16],['5.75 mm',17.16],['6.00 mm',17.16],['6.25 mm',16.72],['6.50 mm',16.72],['6.75 mm',16.72],['7.00 mm',16.72],['7.25 mm',16.72],['7.50 mm',16.72],['7.75 mm',16.72],['8.00 mm',16.72],['8.25 mm',16.72],['8.50 mm',16.72],['8.75 mm',16.72],['9.00 mm',16.72],['9.50 mm',16.72],['9.25 mm',16.72],['10.00 mm',16.72]],
    'tyre-fac': [['2 mm',19.36],['2.25 mm',18.7],['2.5 mm',17.6],['2.75 mm',16.28],['3 mm',14.96],['3.5 mm',13.2],['4 mm',8.14]],
    'octagon-step': [['4×3 mm',22.66],['5×3 mm',22.66],['4.5×3.5 mm',22],['5×4 mm',22],['5.5×4.5 mm',20.9],['6×4 mm',20.9],['6.5×4.5 mm',20.24],['6×5 mm',20.24],['6.5×5.5 mm',19.36],['7×5 mm',18.7],['8×6 mm',18.7],['7.5×5.5 mm',18.7],['7×6 mm',18.7],['8.5×6.5 mm',18.7],['8×7 mm',18.7],['9×7 mm',18.26],['9.5×7.5 mm',18.26],['10×8 mm',18.26],['11×9 mm',17.6],['12×10 mm',17.6],['14×10 mm',17.6],['14×12 mm',17.6]],
    'maniya': [['5×3 mm',17.47],['6×4 mm',16.94],['7×5 mm',16.85],['8×6 mm',16.63],['9×7 mm',16.54],['10×8 mm',16.46],['11×9 mm',16.46],['4×3 mm',18.04],['4×2.5 mm',18.92]],
    'square': [['2 mm',28.6],['2.25 mm',28.6],['2.5 mm',28.6],['2.75 mm',28.6],['3 mm',26.4],['3.25 mm',26.4],['3.5 mm',24.86],['3.75 mm',24.86],['4 mm',23.1],['4.25 mm',23.1],['4.5 mm',23.1],['4.75 mm',22],['5 mm',22],['5.5 mm',22],['6 mm',19.8],['6.5 mm',19.8],['7 mm',19.8],['7.5 mm',19.14],['8 mm',19.14],['9 mm',19.14],['10 mm',19.14]],
    'ballhole-fac': [['2 mm',18.92],['3 mm',14.52],['4 mm',11],['5 mm',11.88],['6 mm',12.32]],
    'heart': [['4 mm',37.4],['5 mm',36.3],['6 mm',34.1],['8 mm',31.9]],
    'ballhole-plain': [['2 mm',10.12],['2.25 mm',10.12],['2.5 mm',10.12],['2.75 mm',10.12],['3 mm',10.12],['3.25 mm',8.36],['3.5 mm',8.36],['3.75 mm',8.36],['4 mm',8.36],['4.25 mm',8.36],['4.5 mm',8.36],['4.75 mm',8.36],['5 mm',8.36],['5.5 mm',8.36],['6 mm',8.36],['7 mm',8.14],['7.5 mm',8.14],['8 mm',8.14],['9 mm',8.14],['10 mm',8.14],['11 mm',8.14],['12 mm',8.14]],
    'trillion': [['4 mm',34.1],['5 mm',31.9],['6 mm',30.8]],
  },
  'natural|green': {
    'round': [['2.00 mm',12],['2.10 mm',12],['2.20 mm',12],['2.30 mm',12],['2.40 mm',12],['2.50 mm',12],['2.60 mm',12],['2.70 mm',12],['2.80 mm',12],['2.90 mm',12],['3.00 mm',12],['3.25 mm',12],['3.50 mm',12],['3.75 mm',12],['4.00 mm',12],['5.00 mm',10],['5.50 mm',10],['6.00 mm',10],['6.50 mm',10],['7.00 mm',9],['7.50 mm',9],['8.00 mm',9]],
    'square': [['3 mm',20],['3.5 mm',20],['4 mm',16],['5 mm',10],['6 mm',10],['7 mm',9]],
    'marquise': [['2×4 mm',21.5],['2.5×4.5 mm',21.5],['2.50×5 mm',16.5],['3×6 mm',14],['3.5×7 mm',14],['4×8 mm',10],['5×10 mm',10]],
    'octagon-step': [['3×4 mm',16.5],['3.5×4.5 mm',16.5],['3×5 mm',16.5],['4×5 mm',16.5],['4×6 mm',10],['4.5×6.5 mm',10],['5×6 mm',10],['5×7 mm',10],['6×8 mm',9],['7×9 mm',9],['8×10 mm',9]],
    'oval': [['3.25×4.25 mm',15],['3.75×4.75 mm',15],['4×3 mm',15],['5×3 mm',15],['3.50×4.50 mm',15],['4×5 mm',15],['6×4 mm',10],['4.5×5.5 mm',10],['4.5×6.5 mm',10],['5×6 mm',10],['7×5 mm',10],['8×6 mm',9],['7×9 mm',9],['8×10 mm',9]],
    'pear': [['3.25×4.25 mm',15],['3.75×4.75 mm',15],['4×3 mm',15],['5×3 mm',15],['3.50×4.50 mm',15],['4×5 mm',15],['6×4 mm',10],['4.5×5.5 mm',10],['4.5×6.5 mm',10],['5×6 mm',10],['7×5 mm',10],['8×6 mm',9],['7×9 mm',9],['8×10 mm',9]],
    // Bead shapes priced the same as Red opaque (per user request).
    'tyre-fac': [['2 mm',19.36],['2.25 mm',18.7],['2.5 mm',17.6],['2.75 mm',16.28],['3 mm',14.96],['3.5 mm',13.2],['4 mm',8.14]],
    'maniya': [['5×3 mm',17.47],['6×4 mm',16.94],['7×5 mm',16.85],['8×6 mm',16.63],['9×7 mm',16.54],['10×8 mm',16.46],['11×9 mm',16.46],['4×3 mm',18.04],['4×2.5 mm',18.92]],
    'ballhole-fac': [['2 mm',18.92],['3 mm',14.52],['4 mm',11],['5 mm',11.88],['6 mm',12.32]],
    'ballhole-plain': [['2 mm',10.12],['2.25 mm',10.12],['2.5 mm',10.12],['2.75 mm',10.12],['3 mm',10.12],['3.25 mm',8.36],['3.5 mm',8.36],['3.75 mm',8.36],['4 mm',8.36],['4.25 mm',8.36],['4.5 mm',8.36],['4.75 mm',8.36],['5 mm',8.36],['5.5 mm',8.36],['6 mm',8.36],['7 mm',8.14],['7.5 mm',8.14],['8 mm',8.14],['9 mm',8.14],['10 mm',8.14],['11 mm',8.14],['12 mm',8.14]],
  },
};
function opaqueNatSizes(gradeId, colorId, shape) {
  const g = OPAQUE_NAT_SHEETS[gradeId + '|' + colorId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function opaqueNatRate(gradeId, colorId, shape, size) {
  const g = OPAQUE_NAT_SHEETS[gradeId + '|' + colorId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  return row ? row[1] : null;
}
window.opaqueNatSizes = opaqueNatSizes;
window.opaqueNatRate = opaqueNatRate;

// Navratna · per-grade price sheet (RIVEN 'B' quality tier; hidden AA/A/C tiers
// ignored). One flat price per 9-stone packet. Row: [size, ₹/packet]. Square→cushion, Maq→marquise.
const NAVRATNA_SHEETS = {
  'natural': {
    'round': [['1.50 mm',330.75],['1.60 mm',294],['1.70 mm',257.25],['1.80 mm',220.5],['1.90 mm',191.1],['2.00 mm',145.24],['2.10 mm',122.89],['2.20 mm',134.06],['2.30 mm',145.24],['2.40 mm',156.41],['2.50 mm',167.58],['2.60 mm',178.75],['2.70 mm',195.51],['2.80 mm',217.85],['2.90 mm',240.2],['3.00 mm',307.23],['3.10 mm',296.06],['3.20 mm',335.16],['3.30 mm',379.85],['3.40 mm',424.54],['3.50 mm',469.22],['3.60 mm',513.91],['3.70 mm',558.6],['3.80 mm',614.46],['3.90 mm',670.32],['4.00 mm',754.11],['4.10 mm',865.83],['4.20 mm',977.55],['4.30 mm',1089.27],['4.40 mm',1256.85],['4.50 mm',1424.43],['4.60 mm',1675.8],['4.70 mm',1815.45],['4.80 mm',1955.1],['4.90 mm',2234.4],['5.00 mm',2513.7],['5.10 mm',2793],['5.20 mm',3072.3],['5.30 mm',3351.6],['5.40 mm',3630.9],['5.50 mm',3910.2],['5.60 mm',4468.8],['5.70 mm',5027.4],['5.80 mm',5586],['5.90 mm',6144.6],['6.00 mm',7541.1],['6.10 mm',8937.6],['6.20 mm',10334.1],['6.30 mm',11730.6],['6.40 mm',13127.1],['6.50 mm',14523.6],['6.60 mm',15920.1],['6.70 mm',17875.2],['6.80 mm',19830.3],['6.90 mm',21785.4],['7.00 mm',24578.4]],
    'oval': [['3×4 mm',837.9],['3×5 mm',1284.78],['4×5 mm',1955.1],['4×6 mm',2793],['5×6 mm',3351.6],['5×7 mm',4189.5],['6×8 mm',6703.2],['7×9 mm',13406.4],['8×10 mm',22344]],
    'pear': [['3×4 mm',1284.78],['3×5 mm',1955.1],['4×5 mm',2513.7],['4×6 mm',3910.2],['5×6 mm',5027.4],['5×7 mm',6703.2],['6×8 mm',11172],['7×9 mm',17875.2],['8×10 mm',25137]],
    'cushion': [['2 mm',2513.7],['2.5 mm',2234.4],['3 mm',2793],['3.5 mm',3351.6],['4 mm',3630.9],['4.5 mm',3910.2],['5 mm',4189.5],['5.5 mm',5306.7],['6 mm',6703.2],['6.5 mm',8379],['7 mm',10054.8]],
    'marquise': [['2×4 mm',1117.2],['2.5×5 mm',1675.8],['3×6 mm',2793],['3.5×7 mm',4189.5],['4×8 mm',5586],['5×10 mm',10054.8]],
  },
  // Created Navratna · Round only. Price is per SET (1 set = 9 pieces = 1 packet).
  'created': {
    'round': [['1.50 mm',100],['2.00 mm',100],['2.50 mm',100],['3.00 mm',150],['3.50 mm',200],['4.00 mm',200],['5.00 mm',400]],
  },
};
function navSizes(gradeId, shape) {
  const g = NAVRATNA_SHEETS[gradeId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function navPrice(gradeId, shape, size) {
  const g = NAVRATNA_SHEETS[gradeId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  return row ? row[1] : null;
}
window.navSizes = navSizes;
window.navPrice = navPrice;

// Polki · per grade price sheets (grade id = 'kundan' or 'white-regular').
// Kundan foil rows [size,pcs,₹/piece] (uses the base PRICE column); Flat/Regular
// rows [size,pcs,₹/piece,g per 1000] carry weight. Square maps to Cushion.
const POLKI_SHEETS = {
  'kundan': {
    'round': [['2.00 mm',500,0.99],['2.25 mm',500,1.04],['2.50 mm',500,1.08],['2.75 mm',500,1.17],['3.00 mm',500,1.17],['3.25 mm',200,1.53],['3.50 mm',200,1.53],['3.75 mm',200,1.62],['4.00 mm',200,1.62],['4.50 mm',200,1.98],['5.00 mm',200,2.43],['5.50 mm',200,3.42],['6.00 mm',200,3.42],['6.50 mm',100,5.4],['7.00 mm',100,5.4],['8.00 mm',100,8.1],['9.00 mm',50,13],['10.00 mm',50,16]],
    'cushion': [['2 mm',500,1.35],['2.5 mm',500,1.53],['3 mm',500,1.62],['3.5 mm',200,1.98],['4 mm',200,2.07],['4.5 mm',200,3.06],['5 mm',200,3.24],['5.5 mm',200,4.32],['6 mm',200,4.68],['6.5 mm',100,7.2],['7 mm',100,9.54],['8 mm',100,13.5]],
    'oval': [['3×2 mm',500,1.44],['3×2.5 mm',500,1.44],['4×3 mm',500,1.53],['3.5×2.5 mm',500,1.53],['5×3 mm',500,1.62],['4.5×3.5 mm',500,1.98],['5×4 mm',200,2.07],['6×4 mm',200,2.43],['6×5 mm',200,3.75],['7×5 mm',200,3.42],['8×6 mm',100,5.4],['9×7 mm',100,8.1],['10×8 mm',50,11.7],['11×9 mm',50,14.68]],
    'pear': [['3×2 mm',500,1.44],['3×2.5 mm',500,1.44],['4×3 mm',500,1.53],['3.5×2.5 mm',500,1.53],['5×3 mm',500,1.62],['4.5×3.5 mm',500,1.98],['5×4 mm',200,2.07],['6×4 mm',200,2.43],['6×5 mm',200,3.75],['7×5 mm',200,3.42],['8×6 mm',100,5.4],['9×7 mm',100,8.1],['10×8 mm',50,11.7],['11×9 mm',50,14.68]],
    'marquise': [['3×1.5 mm',500,1.44],['4×2 mm',500,1.35],['5×2.5 mm',500,1.53],['6×3 mm',200,2.34],['7×3.5 mm',200,4.14],['8×4 mm',200,4.68],['10×5 mm',100,7]],
    'octagon-step': [['5×2.5 mm',200,2.7],['5×3 mm',200,3.24],['6×4 mm',200,4.5],['7×5 mm',100,5.4],['8×6 mm',100,7.2]],
  },
  'white-regular': {
    'round': [['2.00 mm',1000,1.33,17],['2.25 mm',1000,1.4],['2.50 mm',1000,1.47,20],['2.75 mm',1000,1.61,25],['3.00 mm',1000,1.68,27],['3.25 mm',500,2.1],['3.50 mm',500,2.1,35],['3.75 mm',500,2.24],['4.00 mm',500,2.24,45],['4.50 mm',500,2.8,55],['5.00 mm',500,3.5,65],['5.50 mm',500,4.2,100],['6.00 mm',500,4.69,100],['7.00 mm',500,7.35,140],['8.00 mm',200,11.2,250],['9.00 mm',200,18.2,400],['10.00 mm',100,22.4,650]],
    'cushion': [['2 mm',1000,1.96],['2.5 mm',1000,2.1],['3 mm',1000,2.24,45],['3.5 mm',500,2.8],['4 mm',500,2.94,65],['4.5 mm',500,4.41],['5 mm',500,4.69,95],['6 mm',200,6.3,130],['7 mm',100,8.4,350],['8 mm',100,14.7,550],['10 mm',100,18.2,800]],
    'oval': [['2×3 mm',1000,2.1,50],['2.5×3 mm',1000,2.24,50],['2.5×3.5 mm',1000,2.24,55],['3×4 mm',1000,2.24,50],['3.5×4.5 mm',1000,2.24,55],['3×5 mm',1000,2.45,55],['4×5 mm',500,2.94,65],['4×6 mm',500,3.5,75],['5×7 mm',500,4.9,115],['6×8 mm',200,7,160],['7×9 mm',200,11.2,280],['8×10 mm',200,15.4,360]],
    'pear': [['2×3 mm',1000,2.1,50],['2.5×3 mm',1000,2.24,50],['2.5×3.5 mm',1000,2.24,55],['3×4 mm',1000,2.24,50],['3.5×4.5 mm',1000,2.24,55],['3×5 mm',1000,2.45,55],['4×5 mm',500,2.94,65],['4×6 mm',500,3.5,75],['5×7 mm',500,4.9,115],['6×8 mm',200,7,160],['7×9 mm',200,11.2,280],['8×10 mm',200,15.4,360]],
    'marquise': [['1.5×3 mm',1000,1.96],['2×4 mm',1000,1.96,45],['2.5×5 mm',500,2.24,48],['3×6 mm',500,2.94,65],['3.5×7 mm',200,4.9,100],['4×8 mm',200,6.3,130],['5×10 mm',200,9.8,300]],
  },
};
const POLKI_SHAPES_BY_GRADE = {
  'kundan': ['round','cushion','oval','pear','marquise','octagon-step'],
  'white-regular': ['round','cushion','oval','pear','marquise'],
};
function polkiSizes(gradeId, shape) {
  const g = POLKI_SHEETS[gradeId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function polkiSku(gradeId, shape, size) {
  const g = POLKI_SHEETS[gradeId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'polki-' + gradeId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row[3] != null ? row[3] : null };
}
function polkiHasWeight(gradeId, shape) {
  const g = POLKI_SHEETS[gradeId];
  return !!(g && g[shape] && g[shape].some((r) => r[3] != null));
}
window.polkiSizes = polkiSizes; window.polkiSku = polkiSku;
window.polkiHasWeight = polkiHasWeight; window.POLKI_SHAPES_BY_GRADE = POLKI_SHAPES_BY_GRADE;

// Lab Opals · per grade+colour price sheet WITH weight. Row [size,pcs,₹/piece,g per 1000].
const LABOPAL_SHEETS = {
  'a|white': {
    'round': [['2.00 mm',100,8.1,3.86],['2.50 mm',100,10.8,7.01],['3.00 mm',100,11.7,9.47],['3.50 mm',100,18,15.02],['4.00 mm',100,19.8,20.04],['5.00 mm',50,27,30.05],['6.00 mm',50,36,43.89],['7.00 mm',50,50.4,67.71],['8.00 mm',25,75.6,97.9],['9.00 mm',25,90,154.2],['10.00 mm',25,108,190.42]],
    'oval': [['3×2 mm',100,10.8,7.84],['4×3 mm',100,18,14.29],['5×3 mm',100,21.6,19.72],['6×4 mm',50,27,29.69],['7×5 mm',50,36,53.75],['8×6 mm',50,50.4,41.88],['9×7 mm',50,75.6,107.44],['10×8 mm',25,90,164.8],['11×9 mm',25,120,190.2],['12×10 mm',25,140,282.8],['14×10 mm',25,160,315.3],['16×12 mm',25,232,536.5]],
    'heart': [['3 mm',100,13.5,9.14],['4 mm',100,21.6,16.34],['5 mm',50,28.8,31.3],['6 mm',50,37.8,40.8],['7 mm',50,52.2,66.2],['8 mm',50,77.4,97.61],['9 mm',25,91.8,140.57],['10 mm',25,109.8,196.6]],
    'pear': [['3×2 mm',100,10.8,6.73],['4×3 mm',100,18,13.42],['5×3 mm',100,21.6,17.69],['6×4 mm',50,27,32.71],['7×5 mm',50,36,48.33],['8×6 mm',50,50.4,75.52],['9×7 mm',50,75.6,98.76],['10×8 mm',25,90,147.72]],
    'marquise': [['3×1.5 mm',100,14.4,4.97],['4×2 mm',100,16.2,8.56],['6×3 mm',50,25.2,23.57],['7×3.5 mm',50,32.4,28.56],['8×4 mm',25,39.6,38.86],['10×5 mm',25,82.8,86.63]],
  },
};
function labopalSizes(gradeId, colorId, shape) {
  const g = LABOPAL_SHEETS[gradeId + '|' + colorId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function labopalSku(gradeId, colorId, shape, size) {
  const g = LABOPAL_SHEETS[gradeId + '|' + colorId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'labo-' + gradeId + '-' + colorId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row[3] != null ? row[3] : null };
}
function labopalHasWeight(gradeId, colorId, shape) {
  const g = LABOPAL_SHEETS[gradeId + '|' + colorId];
  return !!(g && g[shape] && g[shape].some((r) => r[3] != null));
}
window.labopalSizes = labopalSizes; window.labopalSku = labopalSku; window.labopalHasWeight = labopalHasWeight;

// Cabochons · per grade+colour price sheet. Row [size,pcs,₹/piece]. OS/PS fills oval, pear and pear-oval.
const CABOCHON_SHEETS = {
  'aa|red': {
    'round': [['1.50 mm',1000,0.35],['1.70 mm',1000,0.48],['1.75 mm',1000,0.53],['1.80 mm',1000,0.53],['2.00 mm',1000,0.48],['2.25 mm',1000,0.58],['2.50 mm',1000,0.69],['2.75 mm',1000,0.77],['3.00 mm',1000,0.97],['3.25 mm',500,1.26],['3.50 mm',500,1.6],['3.75 mm',500,1.96],['4.00 mm',500,2.04],['4.25 mm',200,2.38],['4.50 mm',200,3.37],['4.75 mm',200,3.57],['5.00 mm',200,3.99],['5.50 mm',200,6.12],['6.00 mm',200,6.97],['6.50 mm',200,8.1],['7.00 mm',200,11.56],['8.00 mm',200,15.3]],
    'oval': [['3×2 mm',1000,1.24],['3×2.5 mm',1000,1.53],['4×3 mm',1000,1.56],['3.5×2.5 mm',1000,1.56],['5×3 mm',1000,1.9],['4.5×3.5 mm',500,2.81],['5×4 mm',500,2.89],['6×4 mm',500,3.23],['7×5 mm',500,5.61],['8×6 mm',200,9.69],['9×7 mm',200,14.62],['10×8 mm',100,18.7]],
    'pear': [['3×2 mm',1000,1.24],['3×2.5 mm',1000,1.53],['4×3 mm',1000,1.56],['3.5×2.5 mm',1000,1.56],['5×3 mm',1000,1.9],['4.5×3.5 mm',500,2.81],['5×4 mm',500,2.89],['6×4 mm',500,3.23],['7×5 mm',500,5.61],['8×6 mm',200,9.69],['9×7 mm',200,14.62],['10×8 mm',100,18.7]],
    'pearoval': [['3×2 mm',1000,1.24],['3×2.5 mm',1000,1.53],['4×3 mm',1000,1.56],['3.5×2.5 mm',1000,1.56],['5×3 mm',1000,1.9],['4.5×3.5 mm',500,2.81],['5×4 mm',500,2.89],['6×4 mm',500,3.23],['7×5 mm',500,5.61],['8×6 mm',200,9.69],['9×7 mm',200,14.62],['10×8 mm',100,18.7]],
    'marquise': [['3×1.5 mm',1000,0.97],['4×2 mm',1000,1.02],['5×2.5 mm',1000,1.55],['6×3 mm',1000,2.46],['7×3.5 mm',1000,4.42],['8×4 mm',500,5.27],['10×5 mm',500,12.75]],
    'square': [['2 mm',1000,0.78],['2.5 mm',1000,0.88],['3 mm',1000,1.26],['3.5 mm',1000,2.07],['4 mm',1000,2.52],['5 mm',500,5.27],['6 mm',500,9.01]],
  },
  'aa|green': {
    'round': [['1.50 mm',1000,0.18],['1.75 mm',1000,0.2],['2.00 mm',1000,0.25],['2.25 mm',1000,0.35],['2.50 mm',1000,0.45],['2.75 mm',1000,0.6],['3.00 mm',1000,0.65],['3.50 mm',500,0.9],['3.75 mm',500,1.1],['4.00 mm',500,1.25],['4.25 mm',500,2],['4.50 mm',500,2.25],['4.75 mm',500,2.5],['5.00 mm',500,3],['5.50 mm',500,4],['6.00 mm',200,4],['7.00 mm',200,6],['8.00 mm',200,8],['9.00 mm',200,13]],
    'oval': [['2×3 mm',1000,0.75],['3×2.5 mm',1000,0.8],['2.5×3.5 mm',1000,1.1],['4×3 mm',1000,1.1],['5×3 mm',1000,1.2],['4×5 mm',500,1.8],['6×4 mm',500,2],['7×5 mm',500,3.75],['8×6 mm',200,6],['9×7 mm',200,9],['8×10 mm',200,11.5]],
    'pear': [['2×3 mm',1000,0.75],['3×2.5 mm',1000,0.8],['2.5×3.5 mm',1000,1.1],['4×3 mm',1000,1.1],['5×3 mm',1000,1.2],['4×5 mm',500,1.8],['6×4 mm',500,2],['7×5 mm',500,3.75],['8×6 mm',200,6],['9×7 mm',200,9],['8×10 mm',200,11.5]],
    'pearoval': [['2×3 mm',1000,0.75],['3×2.5 mm',1000,0.8],['2.5×3.5 mm',1000,1.1],['4×3 mm',1000,1.1],['5×3 mm',1000,1.2],['4×5 mm',500,1.8],['6×4 mm',500,2],['7×5 mm',500,3.75],['8×6 mm',200,6],['9×7 mm',200,9],['8×10 mm',200,11.5]],
    'marquise': [['1.5×3 mm',1000,0.75],['4×2 mm',1000,0.75],['5×2.5 mm',1000,1.05],['6×3 mm',500,1.5],['3.5×7 mm',500,2.5],['8×4 mm',200,3.25],['5×10 mm',200,6]],
    'square': [['2 mm',1000,0.65],['2.5 mm',1000,0.8],['3 mm',1000,1.05],['4 mm',500,1.6],['5 mm',500,3],['6 mm',200,4.25]],
  },
  'aaa|green': {
    'round': [['2.00 mm',1000,0.41,10.41],['2.25 mm',1000,0.65,15.16],['2.50 mm',1000,0.73,20.43],['3.00 mm',1000,1.06,null],['3.25 mm',1000,1.22,null],['3.50 mm',1000,1.38,null],['4.00 mm',500,2.11,80.06],['4.50 mm',500,3.24,111.98],['5.00 mm',500,3.41,135.42],['6.00 mm',200,4.87,169.75],['7.00 mm',200,9.75,null]],
    'square': [['2 mm',1000,0.82,13.25],['2.5 mm',1000,1.26,22],['3 mm',1000,1.39,39],['3.5 mm',500,2.16,66.22],['4 mm',200,2.44,100.5],['5 mm',200,4.89,181.7]],
    'oval': [['3×2 mm',1000,1.05,null],['3×2.5 mm',1000,1.21,null],['3.5×2.5 mm',1000,1.38,null],['4×3 mm',500,1.4,47],['4.5×3.5 mm',500,1.54,null],['5×3 mm',500,1.54,null],['5×4 mm',500,2.76,null],['6×4 mm',500,2.92,117.14],['7×5 mm',200,6.17,190],['8×6 mm',200,7.79,null],['9×7 mm',200,8.64,null]],
    'pear': [['3×2 mm',1000,1.05,null],['3×2.5 mm',1000,1.21,24.25],['3.5×2.5 mm',1000,1.38,null],['4×3 mm',500,1.4,46.1],['4.5×3.5 mm',500,1.54,63.26],['5×3 mm',500,1.54,49.76],['5×4 mm',500,2.76,92.42],['6×4 mm',500,2.92,113.1],['7×5 mm',200,6.17,null],['8×6 mm',200,7.79,336],['9×7 mm',200,8.64,null]],
    'marquise': [['4×2 mm',1000,1.05,15.93],['5×2.5 mm',1000,1.38,34.75],['6×3 mm',500,2.28,null]],
  },
  'aaa|red': {
    'round': [['2.00 mm',1000,0.63,null],['2.50 mm',1000,1.36,26.25],['2.75 mm',1000,1.8,34.58],['3.00 mm',1000,2.18,41.9],['3.25 mm',1000,2.94,53.8],['3.50 mm',1000,2.7,66.5],['3.75 mm',1000,4.66,77.94],['4.00 mm',500,4.83,104],['4.25 mm',500,6.23,128],['4.50 mm',500,7.39,146],['4.75 mm',500,8.9,183],['5.00 mm',500,9.94,196],['5.50 mm',200,9.9,null],['7.00 mm',200,9.8,null]],
    'square': [['2 mm',1000,1.44,null],['3 mm',1000,2.07,null],['4 mm',200,4.5,null],['5 mm',200,9.54,null]],
    'oval': [['3×2 mm',1000,1.8,null],['3×2.5 mm',1000,2.16,34.38],['3.5×2.5 mm',1000,2.7,37.13],['4×3 mm',500,2.84,60.64],['5×3 mm',500,3.42,null],['5×4 mm',500,5.4,114.64],['6×4 mm',500,5.76,null],['7×5 mm',200,9.54,null],['8×6 mm',200,15.12,426.2],['9×7 mm',200,21.78,null]],
    'pear': [['3×2 mm',1000,1.8,null],['3×2.5 mm',1000,2.16,null],['3.5×2.5 mm',1000,2.7,32],['4×3 mm',500,2.84,68.36],['5×3 mm',500,3.42,null],['5×4 mm',500,5.4,64],['6×4 mm',500,5.76,null],['7×5 mm',200,9.54,145],['8×6 mm',200,15.12,null],['9×7 mm',200,21.78,null]],
    'marquise': [['4×2 mm',1000,1.67,26.9],['5×2.5 mm',1000,2.7,null],['6×3 mm',500,4.32,80]],
  },
};
function cabSizes(gradeId, colorId, shape) {
  const g = CABOCHON_SHEETS[gradeId + '|' + colorId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function cabSku(gradeId, colorId, shape, size) {
  const g = CABOCHON_SHEETS[gradeId + '|' + colorId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'cab-' + gradeId + '-' + colorId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row.length > 3 && row[3] != null ? row[3] : null };
}
function cabHasWeight(gradeId, colorId, shape) {
  const g = CABOCHON_SHEETS[gradeId + '|' + colorId];
  return !!(g && g[shape] && g[shape].some((r) => r.length > 3 && r[3] != null));
}
window.cabSizes = cabSizes; window.cabSku = cabSku; window.cabHasWeight = cabHasWeight;

// Pearls · per grade+colour price sheet (per-piece packet, with weight).
// Fresh-water half-drilled ('bottom hole') round pearls priced from the NEW X18 column.
const PEARL_SHEETS = {
  'natural|white': {
    'halfdrilled': [['2.00 mm',300,20.7,15],['2.25 mm',300,18,null],['2.50 mm',310,18,17],['2.75 mm',310,18,null],['3.00 mm',250,18,30],['3.50 mm',200,19.8,54],['3.75 mm',200,19.8,null],['4.00 mm',200,19.8,65],['4.50 mm',180,22.5,140],['5.00 mm',160,22.5,150],['5.50 mm',120,28.8,215],['6.00 mm',112,28.8,290],['6.50 mm',104,36.9,335],['7.00 mm',96,36.9,330],['7.50 mm',66,64.8,485],['8.00 mm',66,64.8,685],['8.50 mm',60,91.8,670],['9.00 mm',60,91.8,810],['10.00 mm',54,162,980],['11.00 mm',54,270,null],['12.00 mm',54,378,null],['13.00 mm',54,774,null],['14.00 mm',54,1224,null],['15.00 mm',54,2070,null],['16.00 mm',54,2160,null]],
    'cabs': [['2.00 mm',300,20.7,15],['2.25 mm',300,18,null],['2.50 mm',310,18,17],['2.75 mm',310,18,null],['3.00 mm',250,18,30],['3.50 mm',200,19.8,54],['3.75 mm',200,19.8,null],['4.00 mm',200,19.8,65],['4.50 mm',180,22.5,140],['5.00 mm',160,22.5,150],['5.50 mm',120,28.8,215],['6.00 mm',112,28.8,290],['6.50 mm',104,36.9,335],['7.00 mm',96,36.9,330],['7.50 mm',66,64.8,485],['8.00 mm',66,64.8,685],['8.50 mm',60,91.8,670],['9.00 mm',60,91.8,810],['10.00 mm',54,162,980],['11.00 mm',54,270,null],['12.00 mm',54,378,null],['13.00 mm',54,774,null],['14.00 mm',54,1224,null],['15.00 mm',54,2070,null],['16.00 mm',54,2160,null]],
  },
  'created|white': {
    'halfdrilled': [['2.00 mm',200,11.2],['2.50 mm',200,7.7],['3.00 mm',200,7.7],['3.50 mm',200,7.7],['4.00 mm',200,7],['4.50 mm',200,7],['5.00 mm',100,7],['6.00 mm',100,7],['7.00 mm',100,9.8],['8.00 mm',50,9.8],['9.00 mm',50,14],['10.00 mm',50,14],['11.00 mm',30,22.4],['12.00 mm',30,22.4],['13.00 mm',30,25.2],['14.00 mm',30,25.2],['15.00 mm',30,37.8],['16.00 mm',20,37.8],['17.00 mm',20,50.4],['18.00 mm',20,56],['19.00 mm',20,67.2],['20.00 mm',20,70]],
    'cabs': [['2.00 mm',200,11],['2.50 mm',200,11],['3.00 mm',200,11],['3.50 mm',200,11],['4.00 mm',200,11.2],['5.00 mm',100,11.2],['6.00 mm',100,11.2],['7.00 mm',100,16.8],['8.00 mm',50,22.4],['9.00 mm',50,22.4],['10.00 mm',50,22.4],['11.00 mm',50,25.2],['12.00 mm',30,22.4],['13.00 mm',30,30.8],['14.00 mm',30,30.8],['15.00 mm',30,39.2],['16.00 mm',20,44.8],['18.00 mm',20,44.8],['20.00 mm',20,70]],
    'fulldrilled': [['2.00 mm',1000,1.84,11],['2.50 mm',1000,1.84,25],['3.00 mm',1000,1.64,42],['3.50 mm',500,3.27,160],['4.00 mm',500,2.17,182],['5.00 mm',500,2.68,380],['6.00 mm',500,3.29,540],['7.00 mm',250,4.33,1808],['8.00 mm',250,5.01,2684],['9.00 mm',250,7.91,3480],['10.00 mm',100,8.36,12600],['12.00 mm',100,19,16900]],
  },
  'created|lightgold': {
    'halfdrilled': [['2.00 mm',200,11.2],['2.50 mm',200,7.7],['3.00 mm',200,7.7],['3.50 mm',200,7.7],['4.00 mm',200,7],['4.50 mm',200,7],['5.00 mm',100,7],['6.00 mm',100,7],['7.00 mm',100,9.8],['8.00 mm',50,9.8],['9.00 mm',50,14],['10.00 mm',50,14],['11.00 mm',30,22.4],['12.00 mm',30,22.4],['13.00 mm',30,25.2],['14.00 mm',30,25.2],['15.00 mm',30,37.8],['16.00 mm',20,37.8],['17.00 mm',20,50.4],['18.00 mm',20,56],['19.00 mm',20,67.2],['20.00 mm',20,70]],
    'cabs': [['2.00 mm',200,11],['2.50 mm',200,11],['3.00 mm',200,11],['3.50 mm',200,11],['4.00 mm',200,11.2],['5.00 mm',100,11.2],['6.00 mm',100,11.2],['7.00 mm',100,16.8],['8.00 mm',50,22.4],['9.00 mm',50,22.4],['10.00 mm',50,22.4],['11.00 mm',50,25.2],['12.00 mm',30,22.4],['13.00 mm',30,30.8],['14.00 mm',30,30.8],['15.00 mm',30,39.2],['16.00 mm',20,44.8],['18.00 mm',20,44.8],['20.00 mm',20,70]],
    'fulldrilled': [['2.00 mm',1000,1.84,11],['2.50 mm',1000,1.84,25],['3.00 mm',1000,1.64,42],['3.50 mm',500,3.27,160],['4.00 mm',500,2.17,182],['5.00 mm',500,2.68,380],['6.00 mm',500,3.29,540],['7.00 mm',250,4.33,1808],['8.00 mm',250,5.01,2684],['9.00 mm',250,7.91,3480],['10.00 mm',100,8.36,12600],['12.00 mm',100,19,16900]],
  },
  'created|cream': {
    'halfdrilled': [['2.00 mm',200,11.2],['2.50 mm',200,7.7],['3.00 mm',200,7.7],['3.50 mm',200,7.7],['4.00 mm',200,7],['4.50 mm',200,7],['5.00 mm',100,7],['6.00 mm',100,7],['7.00 mm',100,9.8],['8.00 mm',50,9.8],['9.00 mm',50,14],['10.00 mm',50,14],['11.00 mm',30,22.4],['12.00 mm',30,22.4],['13.00 mm',30,25.2],['14.00 mm',30,25.2],['15.00 mm',30,37.8],['16.00 mm',20,37.8],['17.00 mm',20,50.4],['18.00 mm',20,56],['19.00 mm',20,67.2],['20.00 mm',20,70]],
    'cabs': [['2.00 mm',200,11],['2.50 mm',200,11],['3.00 mm',200,11],['3.50 mm',200,11],['4.00 mm',200,11.2],['5.00 mm',100,11.2],['6.00 mm',100,11.2],['7.00 mm',100,16.8],['8.00 mm',50,22.4],['9.00 mm',50,22.4],['10.00 mm',50,22.4],['11.00 mm',50,25.2],['12.00 mm',30,22.4],['13.00 mm',30,30.8],['14.00 mm',30,30.8],['15.00 mm',30,39.2],['16.00 mm',20,44.8],['18.00 mm',20,44.8],['20.00 mm',20,70]],
    'fulldrilled': [['2.00 mm',1000,1.84,11],['2.50 mm',1000,1.84,25],['3.00 mm',1000,1.64,42],['3.50 mm',500,3.27,160],['4.00 mm',500,2.17,182],['5.00 mm',500,2.68,380],['6.00 mm',500,3.29,540],['7.00 mm',250,4.33,1808],['8.00 mm',250,5.01,2684],['9.00 mm',250,7.91,3480],['10.00 mm',100,8.36,12600],['12.00 mm',100,19,16900]],
  },
  'created|gold': {
    'halfdrilled': [['2.00 mm',200,11.2],['2.50 mm',200,7.7],['3.00 mm',200,7.7],['3.50 mm',200,7.7],['4.00 mm',200,7],['4.50 mm',200,7],['5.00 mm',100,7],['6.00 mm',100,7],['7.00 mm',100,9.8],['8.00 mm',50,9.8],['9.00 mm',50,14],['10.00 mm',50,14],['11.00 mm',30,22.4],['12.00 mm',30,22.4],['13.00 mm',30,25.2],['14.00 mm',30,25.2],['15.00 mm',30,37.8],['16.00 mm',20,37.8],['17.00 mm',20,50.4],['18.00 mm',20,56],['19.00 mm',20,67.2],['20.00 mm',20,70]],
    'cabs': [['2.00 mm',200,11],['2.50 mm',200,11],['3.00 mm',200,11],['3.50 mm',200,11],['4.00 mm',200,11.2],['5.00 mm',100,11.2],['6.00 mm',100,11.2],['7.00 mm',100,16.8],['8.00 mm',50,22.4],['9.00 mm',50,22.4],['10.00 mm',50,22.4],['11.00 mm',50,25.2],['12.00 mm',30,22.4],['13.00 mm',30,30.8],['14.00 mm',30,30.8],['15.00 mm',30,39.2],['16.00 mm',20,44.8],['18.00 mm',20,44.8],['20.00 mm',20,70]],
    'fulldrilled': [['2.00 mm',1000,1.84,11],['2.50 mm',1000,1.84,25],['3.00 mm',1000,1.64,42],['3.50 mm',500,3.27,160],['4.00 mm',500,2.17,182],['5.00 mm',500,2.68,380],['6.00 mm',500,3.29,540],['7.00 mm',250,4.33,1808],['8.00 mm',250,5.01,2684],['9.00 mm',250,7.91,3480],['10.00 mm',100,8.36,12600],['12.00 mm',100,19,16900]],
  },
};
function pearlSheetSizes(gradeId, colorId, shape) {
  const g = PEARL_SHEETS[gradeId + '|' + colorId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function pearlSheetSku(gradeId, colorId, shape, size) {
  const g = PEARL_SHEETS[gradeId + '|' + colorId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'pearl-' + gradeId + '-' + colorId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row[3] != null ? row[3] : null };
}
function pearlSheetHasWeight(gradeId, colorId, shape) {
  const g = PEARL_SHEETS[gradeId + '|' + colorId];
  return !!(g && g[shape] && g[shape].some((r) => r[3] != null));
}
window.pearlSheetSizes = pearlSheetSizes; window.pearlSheetSku = pearlSheetSku; window.pearlSheetHasWeight = pearlSheetHasWeight;

// Hollow Shapes MOP · per grade (White MOP / Black Onyx) price sheet. Row [size,pcs,₹/piece].
const HOLLOWMOP_SHEETS = {
  'white': {
    'round': [['6×2 mm',25,39],['8×2 mm',25,45],['10×2 mm',25,54],['12×2 mm',25,60],['14×2 mm',15,75],['16×2 mm',15,96],['20×2 mm',15,126]],
    'square': [['8×2 mm',25,36],['10×2 mm',25,45],['12×2 mm',25,54],['14×2 mm',25,75],['16×2 mm',15,96],['20×2 mm',15,126]],
    'oval': [['10×7 mm',25,54],['10×8 mm',25,54],['12×8 mm',15,63],['12×9 mm',15,63],['14×9 mm',15,81],['14×10 mm',15,81],['16×12 mm',15,96],['20×14 mm',15,150]],
    'baguette': [['8×6 mm',25,54],['10×8 mm',25,54],['12×8 mm',25,75],['14×10 mm',15,81],['16×10 mm',15,96],['20×14 mm',15,150]],
    'pear': [['10×7 mm',25,54],['10×8 mm',25,57],['12×8 mm',25,57],['12×9 mm',25,66],['14×9 mm',15,75],['14×10 mm',15,96],['16×12 mm',15,96],['20×14 mm',15,150]],
    'heart': [['8 mm',25,51],['10 mm',25,54],['12 mm',25,66],['14 mm',15,75],['16 mm',15,96],['18 mm',15,135],['20 mm',15,150]],
    'clover': [['8 mm',25,54],['10 mm',25,60],['12 mm',25,66],['14 mm',25,75],['16 mm',15,96],['18 mm',15,105],['20 mm',15,126]],
    'hexagon': [['10 mm',25,60],['12 mm',25,66],['14 mm',15,75],['16 mm',15,120],['18 mm',15,150],['20 mm',15,180]],
  },
  'onyx': {
    'round': [['6×2 mm',25,36],['8×2 mm',25,42],['10×2 mm',25,48],['12×2 mm',25,54],['14×2 mm',15,66],['16×2 mm',15,72],['20×2 mm',15,84]],
    'square': [['8×2 mm',25,36],['10×2 mm',25,42],['12×2 mm',25,48],['14×2 mm',25,54],['16×2 mm',15,66],['20×2 mm',15,72]],
    'oval': [['10×7 mm',25,48],['10×8 mm',25,51],['12×8 mm',15,54],['12×9 mm',15,60],['14×9 mm',15,66],['14×10 mm',15,69],['16×12 mm',15,75],['20×14 mm',15,84]],
    'baguette': [['8×6 mm',25,42],['10×8 mm',25,48],['12×8 mm',25,54],['14×10 mm',15,66],['16×10 mm',15,75],['20×14 mm',15,84]],
    'pear': [['10×7 mm',25,48],['10×8 mm',25,51],['12×8 mm',25,54],['12×9 mm',25,60],['14×9 mm',15,66],['14×10 mm',15,69],['16×12 mm',15,75],['20×14 mm',15,84]],
    'heart': [['8 mm',25,42],['10 mm',25,48],['12 mm',25,54],['14 mm',15,66],['16 mm',15,75],['18 mm',15,78],['20 mm',15,84]],
    'clover': [['8 mm',25,42],['10 mm',25,48],['12 mm',25,54],['14 mm',25,66],['16 mm',15,75],['18 mm',15,81],['20 mm',15,90]],
    'hexagon': [['10 mm',25,48],['12 mm',25,54],['14 mm',15,66],['16 mm',15,72],['18 mm',15,78],['20 mm',15,84]],
  },
};
function hollowmopSizes(gradeId, shape) {
  const g = HOLLOWMOP_SHEETS[gradeId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function hollowmopSku(gradeId, shape, size) {
  const g = HOLLOWMOP_SHEETS[gradeId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'hmop-' + gradeId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.hollowmopSizes = hollowmopSizes; window.hollowmopSku = hollowmopSku;

// Lab Alexandrite (Syn Corundum Alex) · single-grade price sheet. Row [size,pcs,₹/piece].
// Uses the '46' price column from the RIVEN (a '45' column also exists). SQ -> Cushion.
const ALEX_SHEETS = {
  'round': [['1.00 mm',500,1.2],['1.25 mm',500,1.44],['1.50 mm',500,1.92],['2.00 mm',500,3.84],['2.25 mm',200,6.72],['2.50 mm',200,7.2],['2.75 mm',200,9.6],['3.00 mm',200,10.8],['3.25 mm',100,14.16],['3.50 mm',100,15.6],['3.75 mm',100,18.48],['4.00 mm',100,19.68],['4.50 mm',50,25.68],['5.00 mm',50,32.4],['5.50 mm',50,42.72],['6.00 mm',50,46.8],['6.50 mm',25,58.3],['7.00 mm',25,63.8],['8.00 mm',25,94.6]],
  'cushion': [['1.5 mm',200,8.64],['2 mm',200,8.64],['2.5 mm',200,11.04],['3 mm',100,13.44],['4 mm',50,28.8],['5 mm',50,42],['6 mm',50,60.72],['7 mm',25,77]],
  'heart': [['3 mm',200,15.6],['4 mm',100,24],['5 mm',100,36],['6 mm',50,51.6],['7 mm',50,70.4],['8 mm',25,101.2],['10 mm',25,198]],
  'oval': [['3×2 mm',200,10.32],['4×3 mm',200,16.8],['5×3 mm',100,19.2],['5×4 mm',100,26.88],['6×4 mm',50,30.48],['7×5 mm',50,26.29],['8×6 mm',25,66],['9×7 mm',25,94.6],['10×8 mm',25,129.8]],
  'pear': [['3×2 mm',200,10.32],['4×3 mm',200,16.8],['5×3 mm',100,19.2],['5×4 mm',100,26.88],['6×4 mm',50,30.48],['7×5 mm',50,26.29],['8×6 mm',25,66],['9×7 mm',25,94.6],['10×8 mm',25,129.8]],
  'marquise': [['3×1.5 mm',100,12],['4×2 mm',100,12],['5×2.5 mm',100,15.6],['6×3 mm',100,24],['7×3.5 mm',50,55.66],['8×4 mm',50,44],['10×5 mm',25,71.5]],
};
function alexSizes(shape) { const g = ALEX_SHEETS[shape]; return g ? g.map((r) => r[0]) : []; }
function alexSku(shape, size) {
  const g = ALEX_SHEETS[shape]; const row = g ? g.find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'alex-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.alexSizes = alexSizes; window.alexSku = alexSku;

// Rajkot mass zirconia · per grade+colour round price sheet (HO tier). Packet = 1000 pcs;
// row price is ₹/piece (= HO ÷ 1000). White uses the 'white-shampoo' sub-grade.
const RAJKOT_SHEETS = {
  'white-shampoo|white': { 'round': [['1.00 mm',1000,0.0412],['1.10 mm',1000,0.047],['1.20 mm',1000,0.0547],['1.30 mm',1000,0.0595],['1.40 mm',1000,0.0767],['1.50 mm',1000,0.0921],['1.60 mm',1000,0.1074],['1.70 mm',1000,0.1208],['1.80 mm',1000,0.1458],['1.90 mm',1000,0.1726],['2.00 mm',1000,0.188]] },
  'color|ruby5aa': { 'round': [['1.00 mm',1000,0.0832],['1.10 mm',1000,0.1479],['1.20 mm',1000,0.1572],['1.30 mm',1000,0.1719],['1.40 mm',1000,0.1849],['1.50 mm',1000,0.2126],['1.60 mm',1000,0.2496],['1.70 mm',1000,0.2958],['1.80 mm',1000,0.3236],['1.90 mm',1000,0.3605],['2.00 mm',1000,0.4252]] },
  'color|pinkcz': { 'round': [['1.00 mm',1000,0.0575],['1.10 mm',1000,0.0633],['1.20 mm',1000,0.0767],['1.30 mm',1000,0.0844],['1.40 mm',1000,0.1017],['1.50 mm',1000,0.1113],['1.60 mm',1000,0.1343],['1.70 mm',1000,0.1535],['1.80 mm',1000,0.1765],['1.90 mm',1000,0.2206],['2.00 mm',1000,0.2302],['2.50 mm',1000,0.3836],['3.00 mm',1000,0.5563]] },
  'color|nanogreen': { 'round': [['1.00 mm',1000,0.0397],['1.10 mm',1000,0.0437],['1.20 mm',1000,0.0496],['1.30 mm',1000,0.0516],['1.40 mm',1000,0.0635],['1.50 mm',1000,0.0675],['1.60 mm',1000,0.0774],['1.70 mm',1000,0.0973],['1.80 mm',1000,0.1092],['1.90 mm',1000,0.1291],['2.00 mm',1000,0.147]] },
  'color|nanoblue113': { 'round': [['1.00 mm',1000,0.0437],['1.10 mm',1000,0.0477],['1.20 mm',1000,0.0556],['1.30 mm',1000,0.0635],['1.40 mm',1000,0.0675],['1.50 mm',1000,0.0715],['1.60 mm',1000,0.0854],['1.70 mm',1000,0.0993],['1.80 mm',1000,0.1192],['1.90 mm',1000,0.139],['2.00 mm',1000,0.1589]] },
  'color|nanoblue114': { 'round': [['1.00 mm',1000,0.0437],['1.10 mm',1000,0.0477],['1.20 mm',1000,0.0556],['1.30 mm',1000,0.0635],['1.40 mm',1000,0.0675],['1.50 mm',1000,0.0715],['1.60 mm',1000,0.0854],['1.70 mm',1000,0.0993],['1.80 mm',1000,0.1192],['1.90 mm',1000,0.139],['2.00 mm',1000,0.1589]] },
};
function rajkotSizes(gradeId, colorId, shape) {
  const g = RAJKOT_SHEETS[gradeId + '|' + colorId];
  return g && g[shape] ? g[shape].map((r) => r[0]) : [];
}
function rajkotSku(gradeId, colorId, shape, size) {
  const g = RAJKOT_SHEETS[gradeId + '|' + colorId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'rajkot-' + gradeId + '-' + colorId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.rajkotSizes = rajkotSizes; window.rajkotSku = rajkotSku;

// Milky Corals & Olives · per-grade cab price sheet (one price across all 4 colours).
// Round from RD CAB (with g/1000 weight); oval from the 100% CABS block. Row [size,pcs,₹/pc,g per 1000].
const CORAL_SHEETS = {
  'a': {
    'round': [['2.00 mm',1,5.6,38.9],['2.25 mm',1,5.67,49],['2.50 mm',1,6.61,68],['2.75 mm',1,8.88,101],['3.00 mm',1,9.44,110],['3.25 mm',1,11.33,148],['3.50 mm',1,13.22,205],['3.75 mm',1,15.11,220],['4.00 mm',1,17.57,272],['4.25 mm',1,22.67,327],['4.50 mm',1,24.56,360]],
    'oval': [['3×2.5 mm',500,11,null],['4×3 mm',500,16,160],['5×3 mm',200,19,150],['4.5×3.5 mm',200,24,null],['6×4 mm',200,33.06,null]],
  },
};
function coralSizes(gradeId, shape) { const g = CORAL_SHEETS[gradeId]; return g && g[shape] ? g[shape].map((r) => r[0]) : []; }
function coralSku(gradeId, shape, size) {
  const g = CORAL_SHEETS[gradeId]; const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'coral-' + gradeId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0, wtPer1000: row[3] != null ? row[3] : null };
}
function coralHasWeight(gradeId, shape) { const g = CORAL_SHEETS[gradeId]; return !!(g && g[shape] && g[shape].some((r) => r[3] != null)); }
window.coralSizes = coralSizes; window.coralSku = coralSku; window.coralHasWeight = coralHasWeight;

// Ourosa · per-colour round price sheet (White Shadow / Golden Shadow same). Packet = 1440 pcs;
// row price is ₹/piece (= RETAIL packet price ÷ 1440). Sizes are PP labels.
const OUROSA_SHEETS = {
  'white': { 'round': [['PP 0',1440,0.0931],['PP 1',1440,0.0931],['PP 2',1440,0.0886],['PP 3',1440,0.0878],['PP 4',1440,0.0878],['PP 5',1440,0.0878],['PP 6',1440,0.0878],['PP 7',1440,0.1007],['PP 8',1440,0.1007],['PP 9',1440,0.1114],['PP 10',1440,0.1114]] },
  'golden': { 'round': [['PP 0',1440,0.0931],['PP 1',1440,0.0931],['PP 2',1440,0.0886],['PP 3',1440,0.0878],['PP 4',1440,0.0878],['PP 5',1440,0.0878],['PP 6',1440,0.0878],['PP 7',1440,0.1007],['PP 8',1440,0.1007],['PP 9',1440,0.1114],['PP 10',1440,0.1114]] },
};
function ourosaSku(colorId, shape, size) {
  const g = OUROSA_SHEETS[colorId];
  const row = g && g[shape] ? g[shape].find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'ourosa-' + colorId + '-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.ourosaSku = ourosaSku;

// Evil Eye · Real MOP evil-eye stones (round / heart / marquise), per piece. Row [size,pcs,₹/pc].
const EVILEYE_SHEETS = {
  'round': [['4 mm',25,24],['5 mm',25,24],['6 mm',25,24],['7 mm',25,32],['8 mm',25,36],['9 mm',15,40],['10 mm',15,40],['11 mm',15,40],['12 mm',15,46],['13 mm',15,48],['14 mm',15,56],['15 mm',15,70],['16 mm',15,70],['18 mm',15,110],['20 mm',15,130]],
  'heart': [['6 mm',25,36],['8 mm',25,36],['9 mm',15,40],['10 mm',15,46],['11 mm',15,48],['12 mm',15,44],['13 mm',15,56],['14 mm',15,64],['16 mm',15,70],['18 mm',15,110],['20 mm',15,130]],
  'marquise': [['6×3 mm',25,24],['8×4 mm',25,26],['10×5 mm',25,26],['12×6 mm',25,34],['14×7 mm',25,44],['16×8 mm',25,46],['18×9 mm',25,60],['20×10 mm',25,66]],
};
function evileyeSizes(shape) { const g = EVILEYE_SHEETS[shape]; return g ? g.map((r) => r[0]) : []; }
function evileyeSku(shape, size) {
  const g = EVILEYE_SHEETS[shape]; const row = g ? g.find((r) => r[0] === size) : null;
  if (!row) return null;
  return { id: 'evileye-' + shape + '-' + String(size).replace(/\s/g, ''), price: row[2], pcsPerPacket: row[1], moq: row[1], size, stock: 'in', stockCount: 0 };
}
window.evileyeSizes = evileyeSizes; window.evileyeSku = evileyeSku;

// Bracelet: colours differ per style. Cartier = full 21-colour chart; Rolex = 6 metallic finishes.
const BRACELET_BY_GRADE = {
  cartier: {
    imgPrefix: 'assets/products/bracelet-',
    colors: [
      { id: 'silver', name: 'Silver', hex: '#C0C2C4' }, { id: 'lavender', name: 'Lavender', hex: '#9B7BBF' },
      { id: 'wine', name: 'Wine', hex: '#6E1A2A' }, { id: 'royal', name: 'Royal Blue', hex: '#1E3A8A' },
      { id: 'white', name: 'White', hex: '#F2EFE8' }, { id: 'brown', name: 'Brown', hex: '#5A3A28' },
      { id: 'nightgrey', name: 'Night Grey', hex: '#4A4A48' }, { id: 'gold', name: 'Gold', hex: '#C9A227' },
      { id: 'skyblue', name: 'Sky Blue', hex: '#4FA6D8' }, { id: 'rosegold', name: 'Rose Gold', hex: '#C98A6E' },
      { id: 'orange', name: 'Orange', hex: '#D2691E' }, { id: 'navy', name: 'Navy Blue', hex: '#1B2A4A' },
      { id: 'pink', name: 'Pink', hex: '#E6A4B4' }, { id: 'green', name: 'Green', hex: '#2E6B3E' },
      { id: 'mocha', name: 'Mocha', hex: '#6B4A32' }, { id: 'teal', name: 'Teal Blue', hex: '#1F7A8C' },
      { id: 'champagne', name: 'Champagne', hex: '#D8C9A8' }, { id: 'red', name: 'Red', hex: '#C0202E' },
      { id: 'black', name: 'Black', hex: '#2A2A28' }, { id: 'magenta', name: 'Magenta', hex: '#C81E7A' },
      { id: 'greenapple', name: 'Green Apple', hex: '#4FA02E' },
    ],
  },
  rolex: {
    imgPrefix: 'assets/products/rolexbr-',
    colors: [
      { id: 'silver', name: 'Silver', hex: '#C0C2C4' },
      { id: 'mauve', name: 'Mauve', hex: '#9E6E7A' },
      { id: 'rosegold', name: 'Rose Gold', hex: '#C98A6E' },
      { id: 'gold', name: 'Gold', hex: '#C9A227' },
      { id: 'blue', name: 'Blue', hex: '#1F5FA8' },
      { id: 'black', name: 'Black', hex: '#2A2A28' },
    ],
  },
};
const BRACELET_HERO = {
  cartier: 'assets/products/bracelet-cartier-hero.jpeg',
  rolex: 'assets/products/bracelet-rolex-hero.jpeg',
};

// ---- Admin overlays: shapes / colours added from the Sales App Admin panel ----
// Stored in the browser; merged into the live catalog on load so both the
// customer app and the admin reflect them. (Server persistence = Bright Code.)
const XCOL_KEY = 'eurostar-extra-colors-v1';
const XSHP_KEY = 'eurostar-extra-shapes-v1';
const XGRD_KEY = 'eurostar-grades-override-v1';
(function applyAdminCatalogOverlays() {
  try {
    const xc = JSON.parse(localStorage.getItem(XCOL_KEY) || '{}') || {};
    Object.keys(xc).forEach((cat) => {
      if (!COLORS_BY_CATEGORY[cat]) COLORS_BY_CATEGORY[cat] = [];
      (xc[cat] || []).forEach((col) => {
        if (col && col.id && !COLORS_BY_CATEGORY[cat].some((c) => c.id === col.id))
          COLORS_BY_CATEGORY[cat].push({ id: col.id, name: col.name, hex: col.hex || '#CCCCCC' });
      });
    });
  } catch (e) {}
  try {
    const xs = JSON.parse(localStorage.getItem(XSHP_KEY) || '{}') || {};
    Object.keys(xs).forEach((cat) => {
      if (!SHAPES_BY_CATEGORY[cat]) SHAPES_BY_CATEGORY[cat] = [];
      (xs[cat] || []).forEach((sid) => {
        if (sid && !SHAPES_BY_CATEGORY[cat].includes(sid)) SHAPES_BY_CATEGORY[cat].push(sid);
      });
    });
  } catch (e) {}
  try {
    const xg = JSON.parse(localStorage.getItem(XGRD_KEY) || '{}') || {};
    Object.keys(xg).forEach((cat) => {
      const o = xg[cat] || {};
      let list = (GRADES_BY_CATEGORY[cat] || []).slice();
      // apply field edits to existing grades (preserves subGrades/tone/etc.)
      if (o.edits) list = list.map((g) => o.edits[g.id] ? { ...g, ...o.edits[g.id] } : g);
      // drop removed grades
      if (o.removed && o.removed.length) list = list.filter((g) => o.removed.indexOf(g.id) < 0);
      // append newly-added grades
      (o.added || []).forEach((a) => { if (a && a.id && !list.some((g) => g.id === a.id)) list.push(a); });
      GRADES_BY_CATEGORY[cat] = list;
    });
  } catch (e) {}
})();

Object.assign(window, {
  CATEGORIES, SHAPES, TONES, PRODUCTS, PERSONAS, ORDERS,
  BRACELET_BY_GRADE, BRACELET_HERO,
  STATUS_META, TIMELINE_STAGES, VARIANT_MATRIX,
  STRIP_CARATS_BY_SIZE, stripCarats, OUROSA_SIZES, OUROSA_MM, ourosaMM,
  PEARL_STRING_WT_BY_SIZE, PEARL_STRING_PRICE_BY_SIZE, pearlStringWt, pearlStringPrice,
  PCS_PER_CT, SIZE_PRICE_MULTI, FULL_SIZES,
  GRADES_BY_CATEGORY, SHAPES_BY_CATEGORY, COLORS_BY_CATEGORY, makeBrowseProduct,
  PIECES_PER_PACKET, PACKET_PCS_DEFAULT, PACKET_PCS_BY_CATEGORY, packetPcs, UNIT_BY_CATEGORY, catUnit, unitMoq, unitLabel, unitLabelLong,
  unitPcsEach, unitRate, unitToPcs, ORIGIN_BY_CATEGORY, catOrigin,
  WEIGHT_CATEGORIES, catShowWeight, PACKET_PRICED, catPacketPriced,
  PEARL_SHAPES_BY_GRADE, NAVRATNA_SHAPES_BY_GRADE, OPAQUE_COLORS_BY_GRADE, PEARL_COLORS_BY_GRADE, CORUNDUM_COLORS_BY_GRADE, LABGROWN_COLORS_BY_GRADE, CZ_COLORS_BY_GRADE, RAJKOT_COLORS_BY_GRADE, SIZES_BY_CATEGORY, POLKI_SERIES_DESIGNS,
  findProduct, findTone, findShape, findCategory,
  formatINR, orderTotal, orderQty, normaliseOrder, priceForQty,
  pcsPerCt, sizeUnitPrice, sizePerCtPrice,
  MOISS_CHART, MOISS_PIECE_FROM, moissSizes, moissCtEach, moissPcsPerCt, moissSizeIndex, moissIsPiece,
});

// ===== Per-item availability (sold-out) store — shared by Admin + Sales App =====
// An item is a specific category · grade · colour · shape · size combination.
const SOLDOUT_KEY = 'eurostar-soldout-v1';
function loadSoldOut() { try { return JSON.parse(localStorage.getItem(SOLDOUT_KEY) || '{}') || {}; } catch (e) { return {}; } }
function soldOutKey(cat, grade, color, shape, size) { return [cat, grade, color, shape, size].join('|'); }
function isSoldOut(cat, grade, color, shape, size) { return !!loadSoldOut()[soldOutKey(cat, grade, color, shape, size)]; }
function setSoldOutItem(cat, grade, color, shape, size, v) {
  const all = loadSoldOut(); const k = soldOutKey(cat, grade, color, shape, size);
  if (v) all[k] = true; else delete all[k];
  try { localStorage.setItem(SOLDOUT_KEY, JSON.stringify(all)); } catch (e) {}
  return all;
}
function soldOutForCat(cat) { const all = loadSoldOut(); return Object.keys(all).filter((k) => k.split('|')[0] === cat); }
Object.assign(window, { SOLDOUT_KEY, loadSoldOut, soldOutKey, isSoldOut, setSoldOutItem, soldOutForCat });
