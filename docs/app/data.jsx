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
  { id: 'cutstones',      name: 'Cut Stones',               note: 'Oval, pear, marquise, round, etc.', subShapes: ['round','oval','pear','marquise','cushion','heart'] },
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
    { id: 'malachite', name: 'Malachite', tier: 'Synthetic',
      desc: 'Rich green synthetic malachite',
      tone: 'royal-blue', basePrice: 12, unit: 'pc', fromText: 'from ₹12', fromUnit: 'pc' },
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
  mop:        ['round','square','cube','pearoval','marquise','triangle','heart','baguette','cabochon','clover','shell','bellflower','bulgari','butterfly','flower5','star','dholki','tile'],
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
  natural: ['round','oval','pear','cushion','emerald','marquise','heart'],
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
    { id: 'op290', name: 'Color #290/4', hex: '#C98AA0' },
    { id: 'op210', name: 'Color #210/2', hex: '#7FB4C9' },
    { id: 'op283', name: 'Color #283',   hex: '#9C7DC2' },
    { id: 'op240', name: 'Color #240',   hex: '#E2B43A' },
    { id: 'op223', name: 'Color #223/2', hex: '#5BB89A' },
    { id: 'op216', name: 'Color #216',   hex: '#5B7BC4' },
    { id: 'op209', name: 'Color #209/3', hex: '#4F86B8' },
    { id: 'op288', name: 'Color #288/1', hex: '#D08A5B' },
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
    { id: 'ruby2',  name: 'Ruby 2',  hex: '#B23A4A' },
    { id: 'ruby3',  name: 'Ruby 3',  hex: '#9E2A3A' },
    { id: 'ruby5',  name: 'Ruby 5',  hex: '#8B1E2E' },
    { id: 'ruby8',  name: 'Ruby 8',  hex: '#6E1422' },
    { id: 'blue34', name: 'Blue 34', hex: '#1E3A8A' },
    { id: 'white',  name: 'White',   hex: '#F2EFE8' },
  ],
  aa: [
    { id: 'ruby2',  name: 'Ruby 2',  hex: '#B23A4A' },
    { id: 'ruby3',  name: 'Ruby 3',  hex: '#9E2A3A' },
    { id: 'ruby5',  name: 'Ruby 5',  hex: '#8B1E2E' },
    { id: 'ruby8',  name: 'Ruby 8',  hex: '#6E1422' },
  ],
};

// White Polki "uneven" series — each series is a set of named designs; every design
// has its own W×H footprint (mm). Ordered by packet, priced per piece. Prices and
// pcs-per-packet are catalog data (placeholder values until uploaded via bulk sheet).
const POLKI_SERIES_DESIGNS = {
  b: [
    { id: 'b4l', name: 'B4 Left', dims: [4, 6.3], price: 60, pcsPerPacket: 50 },
    { id: 'b4r', name: 'B4 Right', dims: [4, 6.3], price: 60, pcsPerPacket: 50 },
    { id: 'b5l', name: 'B5 Left', dims: [3.7, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'b5r', name: 'B5 Right', dims: [3.7, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'b6l', name: 'B6 Left', dims: [3.5, 6.2], price: 60, pcsPerPacket: 50 },
    { id: 'b6r', name: 'B6 Right', dims: [3.5, 6.2], price: 60, pcsPerPacket: 50 },
  ],
  c: [
    { id: 'c2', name: 'C2', dims: [5, 7], price: 60, pcsPerPacket: 50 },
    { id: 'c3l', name: 'C3 Left', dims: [7, 7], price: 60, pcsPerPacket: 50 },
    { id: 'c3r', name: 'C3 Right', dims: [7, 7], price: 60, pcsPerPacket: 50 },
    { id: 'c4', name: 'C4', dims: [5.4, 6.9], price: 60, pcsPerPacket: 50 },
    { id: 'c5l', name: 'C5 Left', dims: [5, 6], price: 60, pcsPerPacket: 50 },
    { id: 'c5r', name: 'C5 Right', dims: [5, 6], price: 60, pcsPerPacket: 50 },
    { id: 'c7l', name: 'C7 Left', dims: [5.6, 6.4], price: 60, pcsPerPacket: 50 },
    { id: 'c7r', name: 'C7 Right', dims: [5.6, 6.4], price: 60, pcsPerPacket: 50 },
    { id: 'c8', name: 'C8', dims: [6.3, 7.4], price: 60, pcsPerPacket: 50 },
    { id: 'c9l', name: 'C9 Left', dims: [4, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'c9r', name: 'C9 Right', dims: [4, 6.5], price: 60, pcsPerPacket: 50 },
  ],
  x: [
    { id: 'x1', name: 'X1', dims: [3.2, 4.2], price: 60, pcsPerPacket: 50 },
    { id: 'x2', name: 'X2', dims: [3.5, 3.8], price: 60, pcsPerPacket: 50 },
    { id: 'x3', name: 'X3', dims: [3, 3.8], price: 60, pcsPerPacket: 50 },
    { id: 'x4', name: 'X4', dims: [3, 3.4], price: 60, pcsPerPacket: 50 },
    { id: 'x5', name: 'X5', dims: [3.6, 4], price: 60, pcsPerPacket: 50 },
    { id: 'x6l', name: 'X6 Left', dims: [3, 4], price: 60, pcsPerPacket: 50 },
    { id: 'x6r', name: 'X6 Right', dims: [3, 4], price: 60, pcsPerPacket: 50 },
    { id: 'x7', name: 'X7', dims: [2, 3.6, 3.7], price: 60, pcsPerPacket: 50 },
    { id: 'x8', name: 'X8', dims: [3, 3.2], price: 60, pcsPerPacket: 50 },
    { id: 'x9l', name: 'X9 Left', dims: [3.2, 3.6], price: 60, pcsPerPacket: 50 },
    { id: 'x9r', name: 'X9 Right', dims: [3.2, 3.6], price: 60, pcsPerPacket: 50 },
    { id: 'x10', name: 'X10', dims: [2.8, 4.2], price: 60, pcsPerPacket: 50 },
    { id: 'x12', name: 'X12', dims: [2.8, 3.8], price: 60, pcsPerPacket: 50 },
    { id: 'x13', name: 'X13', dims: [3.7, 3.8], price: 60, pcsPerPacket: 50 },
    { id: 'x15', name: 'X15', dims: [3.3, 4.3], price: 60, pcsPerPacket: 50 },
    { id: 'x16', name: 'X16', dims: [3.9, 3.9], price: 60, pcsPerPacket: 50 },
    { id: 'x17l', name: 'X17 Left', dims: [3.3, 3.7], price: 60, pcsPerPacket: 50 },
    { id: 'x17r', name: 'X17 Right', dims: [3.3, 3.7], price: 60, pcsPerPacket: 50 },
    { id: 'x18', name: 'X18', dims: [3.6, 4.2], price: 60, pcsPerPacket: 50 },
    { id: 'x19', name: 'X19', dims: [3.6, 3.8], price: 60, pcsPerPacket: 50 },
    { id: 'x20', name: 'X20', dims: [3, 3.5], price: 60, pcsPerPacket: 50 },
    { id: 'x21l', name: 'X21 Left', dims: [3.3, 4.3], price: 60, pcsPerPacket: 50 },
    { id: 'x21r', name: 'X21 Right', dims: [3.3, 4.3], price: 60, pcsPerPacket: 50 },
    { id: 'x22l', name: 'X22 Left', dims: [3.6, 3.9], price: 60, pcsPerPacket: 50 },
    { id: 'x22r', name: 'X22 Right', dims: [3.6, 3.9], price: 60, pcsPerPacket: 50 },
    { id: 'x23', name: 'X23', dims: [3.8, 3.8], price: 60, pcsPerPacket: 50 },
  ],
  z: [
    { id: 'z1l', name: 'Z1 Left', dims: [9, 10], price: 60, pcsPerPacket: 50 },
    { id: 'z1r', name: 'Z1 Right', dims: [9, 10], price: 60, pcsPerPacket: 50 },
    { id: 'z3l', name: 'Z3 Left', dims: [5.7, 9.2], price: 60, pcsPerPacket: 50 },
    { id: 'z3r', name: 'Z3 Right', dims: [5.7, 9.2], price: 60, pcsPerPacket: 50 },
    { id: 'z4', name: 'Z4', dims: [7.7, 10.7], price: 60, pcsPerPacket: 50 },
    { id: 'z5l', name: 'Z5 Left', dims: [7.3, 8.1], price: 60, pcsPerPacket: 50 },
    { id: 'z5r', name: 'Z5 Right', dims: [7.3, 8.1], price: 60, pcsPerPacket: 50 },
    { id: 'z6', name: 'Z6', dims: [7.2, 9.3], price: 60, pcsPerPacket: 50 },
    { id: 'z7', name: 'Z7', dims: [6.2, 7.2], price: 60, pcsPerPacket: 50 },
    { id: 'z9', name: 'Z9', dims: [5.4, 8.4], price: 60, pcsPerPacket: 50 },
    { id: 'z10', name: 'Z10', dims: [7.3, 7.7], price: 60, pcsPerPacket: 50 },
    { id: 'z14', name: 'Z14', dims: [6.5, 8], price: 60, pcsPerPacket: 50 },
    { id: 'z15l', name: 'Z15 Left', dims: [4.9, 9.9], price: 60, pcsPerPacket: 50 },
    { id: 'z15r', name: 'Z15 Right', dims: [4.9, 9.9], price: 60, pcsPerPacket: 50 },
    { id: 'z17l', name: 'Z17 Left', dims: [7.4, 8], price: 60, pcsPerPacket: 50 },
    { id: 'z17r', name: 'Z17 Right', dims: [7.4, 8], price: 60, pcsPerPacket: 50 },
    { id: 'z19', name: 'Z19', dims: [6, 7], price: 60, pcsPerPacket: 50 },
    { id: 'z20l', name: 'Z20 Left', dims: [6.8, 8.5], price: 60, pcsPerPacket: 50 },
    { id: 'z20r', name: 'Z20 Right', dims: [6.8, 8.5], price: 60, pcsPerPacket: 50 },
    { id: 'z21', name: 'Z21', dims: [4.7, 8.6], price: 60, pcsPerPacket: 50 },
    { id: 'z22', name: 'Z22', dims: [7.1, 8.1], price: 60, pcsPerPacket: 50 },
    { id: 'z25', name: 'Z25', dims: [5.5, 10.5], price: 60, pcsPerPacket: 50 },
    { id: 'z26', name: 'Z26', dims: [6.3, 8.3], price: 60, pcsPerPacket: 50 },
    { id: 'z27l', name: 'Z27 Left', dims: [6.7, 10.7], price: 60, pcsPerPacket: 50 },
    { id: 'z27r', name: 'Z27 Right', dims: [6.7, 10.7], price: 60, pcsPerPacket: 50 },
  ],
  pcj: [
    { id: 'pcj3', name: 'PCJ 3', dims: [4.5, 6.8], price: 60, pcsPerPacket: 50 },
    { id: 'pcj4', name: 'PCJ 4', dims: [6, 3.5], price: 60, pcsPerPacket: 50 },
    { id: 'pcj5', name: 'PCJ 5', dims: [6.5, 9], price: 60, pcsPerPacket: 50 },
    { id: 'pcj6', name: 'PCJ 6', dims: [8, 11], price: 60, pcsPerPacket: 50 },
    { id: 'pcj7', name: 'PCJ 7', dims: [9, 13], price: 60, pcsPerPacket: 50 },
    { id: 'pcj8', name: 'PCJ 8', dims: [8, 12], price: 60, pcsPerPacket: 50 },
  ],
  gj: [
    { id: 'gj1', name: 'GJ 1', dims: [2.5, 4.4], price: 60, pcsPerPacket: 50 },
    { id: 'gj2l', name: 'GJ 2 Left', dims: [2.9, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj2r', name: 'GJ 2 Right', dims: [2.9, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj3l', name: 'GJ 3 Left', dims: [2.9, 5.8], price: 60, pcsPerPacket: 50 },
    { id: 'gj3r', name: 'GJ 3 Right', dims: [2.9, 5.8], price: 60, pcsPerPacket: 50 },
    { id: 'gj4', name: 'GJ 4', dims: [2, 3, 3.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj5', name: 'GJ 5', dims: [2.5, 4, 4], price: 60, pcsPerPacket: 50 },
    { id: 'gj6', name: 'GJ 6', dims: [2.6, 5.2], price: 60, pcsPerPacket: 50 },
    { id: 'gj7', name: 'GJ 7', dims: [2, 3, 3], price: 60, pcsPerPacket: 50 },
    { id: 'gj8l', name: 'GJ 8 Left', dims: [2.5, 3.2], price: 60, pcsPerPacket: 50 },
    { id: 'gj8r', name: 'GJ 8 Right', dims: [2.5, 3.2], price: 60, pcsPerPacket: 50 },
    { id: 'gj9', name: 'GJ 9', dims: [2, 4.5, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj10', name: 'GJ 10', dims: [2.5, 3], price: 60, pcsPerPacket: 50 },
    { id: 'gj11', name: 'GJ 11', dims: [3, 4, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj12', name: 'GJ 12', dims: [3.5, 4.4], price: 60, pcsPerPacket: 50 },
    { id: 'gj13', name: 'GJ 13', dims: [3.5, 4.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj14', name: 'GJ 14', dims: [3.5, 3.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj15', name: 'GJ 15', dims: [3.6, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj16l', name: 'GJ 16 Left', dims: [3, 6.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj16r', name: 'GJ 16 Right', dims: [3, 6.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj17', name: 'GJ 17', dims: [3.6, 5.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj18', name: 'GJ 18', dims: [3.5, 6], price: 60, pcsPerPacket: 50 },
    { id: 'gj19', name: 'GJ 19', dims: [3.5, 4], price: 60, pcsPerPacket: 50 },
    { id: 'gj20', name: 'GJ 20', dims: [4, 4], price: 60, pcsPerPacket: 50 },
    { id: 'gj21', name: 'GJ 21', dims: [4, 6.4], price: 60, pcsPerPacket: 50 },
    { id: 'gj22', name: 'GJ 22', dims: [4, 4.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj23', name: 'GJ 23', dims: [4, 5.2], price: 60, pcsPerPacket: 50 },
    { id: 'gj24', name: 'GJ 24', dims: [4, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj25', name: 'GJ 25', dims: [4, 4.6], price: 60, pcsPerPacket: 50 },
    { id: 'gj26', name: 'GJ 26', dims: [4, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj27', name: 'GJ 27', dims: [5, 6], price: 60, pcsPerPacket: 50 },
    { id: 'gj28', name: 'GJ 28', dims: [4, 4], price: 60, pcsPerPacket: 50 },
    { id: 'gj29', name: 'GJ 29', dims: [4.5, 8.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj30l', name: 'GJ 30 Left', dims: [4.5, 5.4], price: 60, pcsPerPacket: 50 },
    { id: 'gj31l', name: 'GJ 31 Left', dims: [4.4, 4.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj31r', name: 'GJ 31 Right', dims: [4.4, 4.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj32l', name: 'GJ 32 Left', dims: [4, 6], price: 60, pcsPerPacket: 50 },
    { id: 'gj32r', name: 'GJ 32 Right', dims: [4, 6], price: 60, pcsPerPacket: 50 },
    { id: 'gj33l', name: 'GJ 33 Left', dims: [8, 4], price: 60, pcsPerPacket: 50 },
    { id: 'gj33r', name: 'GJ 33 Right', dims: [8, 4], price: 60, pcsPerPacket: 50 },
    { id: 'gj34l', name: 'GJ 34 Left', dims: [4.5, 7.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj34r', name: 'GJ 34 Right', dims: [4.5, 7.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj35l', name: 'GJ 35 Left', dims: [4, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj35r', name: 'GJ 35 Right', dims: [4, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj36', name: 'GJ 36', dims: [5, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj37', name: 'GJ 37', dims: [5, 4, 3], price: 60, pcsPerPacket: 50 },
    { id: 'gj38', name: 'GJ 38', dims: [5.2, 7.6], price: 60, pcsPerPacket: 50 },
    { id: 'gj39', name: 'GJ 39', dims: [5, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj40', name: 'GJ 40', dims: [5.4, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj41', name: 'GJ 41', dims: [5, 8], price: 60, pcsPerPacket: 50 },
    { id: 'gj42', name: 'GJ 42', dims: [5, 7.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj43', name: 'GJ 43', dims: [5, 5.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj44', name: 'GJ 44', dims: [5, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj45', name: 'GJ 45', dims: [5, 6], price: 60, pcsPerPacket: 50 },
    { id: 'gj46r', name: 'GJ 46 Right', dims: [5, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj47', name: 'GJ 47', dims: [5, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj48', name: 'GJ 48', dims: [5, 5], price: 60, pcsPerPacket: 50 },
    { id: 'gj49l', name: 'GJ 49 Left', dims: [5.4, 6.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj49r', name: 'GJ 49 Right', dims: [5.4, 6.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj50l', name: 'GJ 50 Left', dims: [5.5, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj50r', name: 'GJ 50 Right', dims: [5.5, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj51l', name: 'GJ 51 Left', dims: [5.4, 6.6], price: 60, pcsPerPacket: 50 },
    { id: 'gj51r', name: 'GJ 51 Right', dims: [5.4, 6.6], price: 60, pcsPerPacket: 50 },
    { id: 'gj52l', name: 'GJ 52 Left', dims: [5.4, 7.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj52r', name: 'GJ 52 Right', dims: [5.4, 7.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj53l', name: 'GJ 53 Left', dims: [5.3, 5.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj53r', name: 'GJ 53 Right', dims: [5.3, 5.7], price: 60, pcsPerPacket: 50 },
    { id: 'gj54l', name: 'GJ 54 Left', dims: [5, 9], price: 60, pcsPerPacket: 50 },
    { id: 'gj54r', name: 'GJ 54 Right', dims: [5, 9], price: 60, pcsPerPacket: 50 },
    { id: 'gj55l', name: 'GJ 55 Left', dims: [5, 7.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj55r', name: 'GJ 55 Right', dims: [5, 7.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj56l', name: 'GJ 56 Left', dims: [5.8, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj56r', name: 'GJ 56 Right', dims: [5.8, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj57l', name: 'GJ 57 Left', dims: [5.7, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj57r', name: 'GJ 57 Right', dims: [5.7, 6.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj58', name: 'GJ 58', dims: [6, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj59', name: 'GJ 59', dims: [6, 7.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj60', name: 'GJ 60', dims: [6.5, 7.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj61', name: 'GJ 61', dims: [6, 8.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj62', name: 'GJ 62', dims: [6.5, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj63', name: 'GJ 63', dims: [6, 8.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj64l', name: 'GJ 64 Left', dims: [6, 7], price: 60, pcsPerPacket: 50 },
    { id: 'gj65', name: 'GJ 65', dims: [6, 6], price: 60, pcsPerPacket: 50 },
    { id: 'gj66', name: 'GJ 66', dims: [6, 6], price: 60, pcsPerPacket: 50 },
    { id: 'gj67l', name: 'GJ 67 Left', dims: [6.3, 6.6], price: 60, pcsPerPacket: 50 },
    { id: 'gj67r', name: 'GJ 67 Right', dims: [6.3, 6.6], price: 60, pcsPerPacket: 50 },
    { id: 'gj68l', name: 'GJ 68 Left', dims: [6.5, 10], price: 60, pcsPerPacket: 50 },
    { id: 'gj68r', name: 'GJ 68 Right', dims: [6.5, 10], price: 60, pcsPerPacket: 50 },
    { id: 'gj69l', name: 'GJ 69 Left', dims: [7, 8], price: 60, pcsPerPacket: 50 },
    { id: 'gj70l', name: 'GJ 70 Left', dims: [8, 11.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj70r', name: 'GJ 70 Right', dims: [8, 11.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj71', name: 'GJ 71', dims: [9, 14.5], price: 60, pcsPerPacket: 50 },
    { id: 'gj72l', name: 'GJ 72 Left', dims: [9, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj72r', name: 'GJ 72 Right', dims: [9, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj73l', name: 'GJ 73 Left', dims: [9.3, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj73r', name: 'GJ 73 Right', dims: [9.3, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj74l', name: 'GJ 74 Left', dims: [10, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj74r', name: 'GJ 74 Right', dims: [10, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj75l', name: 'GJ 75 Left', dims: [9.7, 10.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj75r', name: 'GJ 75 Right', dims: [9.7, 10.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj76l', name: 'GJ 76 Left', dims: [9.7, 10], price: 60, pcsPerPacket: 50 },
    { id: 'gj76r', name: 'GJ 76 Right', dims: [9.7, 10], price: 60, pcsPerPacket: 50 },
    { id: 'gj77l', name: 'GJ 77 Left', dims: [9.5, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj77r', name: 'GJ 77 Right', dims: [9.5, 11], price: 60, pcsPerPacket: 50 },
    { id: 'gj78l', name: 'GJ 78 Left', dims: [4.7, 5.3], price: 60, pcsPerPacket: 50 },
    { id: 'gj78r', name: 'GJ 78 Right', dims: [4.7, 5.3], price: 60, pcsPerPacket: 50 },
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
    { id: 'green',     name: 'Green CZ',   hex: '#3E8E4F' },
    { id: 'aqua',      name: 'Aqua CZ',    hex: '#5B7BC4', subShades: [
      { id: 'aqua37', name: '#37', hex: '#6FA8C9' },
      { id: 'aqua38', name: '#38', hex: '#4F86B8' },
      { id: 'aqua39', name: '#39', hex: '#356FA6' },
    ] },
    { id: 'purple',    name: 'Amethyst',   hex: '#9C7DC2' },
    { id: 'inkblue',   name: 'Ink Blue',   hex: '#1E2A6A' },
    { id: 'pink',      name: 'Pink',       hex: '#E6A4B4' },
    { id: 'yellow',    name: 'Yellow',     hex: '#E2B43A' },
    { id: 'brown',     name: 'Brown',      hex: '#7A4A2E' },
    { id: 'garnet',    name: 'Garnet',     hex: '#8B1E2E' },
    { id: 'olive',     name: 'Olive',      hex: '#6B7A3A' },
    { id: 'tanzanite', name: 'Tanzanite',  hex: '#5B5BC4' },
    { id: 'tcf',       name: 'TCF Colours', hex: '#2E9C8E', subShades: [
      { id: 'tcfmint',  name: 'Mint Green TCF',  hex: '#7EC8A8' },
      { id: 'tcfgreen', name: 'Green TCF',       hex: '#2E8C5C' },
      { id: 'tcfarctic',name: 'Arctic Blue TCF', hex: '#6FB8D6' },
      { id: 'tcfred',   name: 'Red TCF',         hex: '#C0392B' },
    ] },
    { id: 'black',     name: 'Black CZ',     hex: '#2A2A28' },
    { id: 'champagne', name: 'Champagne CZ', hex: '#D8C9A8' },
    { id: 'rhodolite', name: 'Rhodolite',    hex: '#9C3A66' },
  ],
  deccan: [
    { id: 'purple',    name: 'Amethyst',   hex: '#9C7DC2' },
    { id: 'inkblue',   name: 'Ink Blue',   hex: '#1E2A6A' },
    { id: 'pink',      name: 'Pink',       hex: '#E6A4B4' },
    { id: 'yellow',    name: 'Yellow',     hex: '#E2B43A' },
    { id: 'garnet',    name: 'Garnet',     hex: '#8B1E2E' },
    { id: 'olive',     name: 'Olive',      hex: '#6B7A3A' },
    { id: 'black',     name: 'Black CZ',     hex: '#2A2A28' },
    { id: 'champagne', name: 'Champagne CZ', hex: '#D8C9A8' },
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
    { id: 'blue',   name: 'Alp Blue',       hex: '#1E3A8A' },
    { id: 'yellow',   name: 'Alp Yellow',       hex: '#E2B43A', shapes: ['round'], sizeMax: 2.00 },
    { id: 'alp162',   name: 'Alp 162/2',        hex: '#C8A24C', shapes: ['round'], sizeMax: 2.00 },
    { id: 'alp-aqua', name: 'Alp Aqua',          hex: '#3ABFBF', shapes: ['round'], sizeMin: 1.00, sizeMax: 3.00 },
    { id: 'paraiba',  name: 'Alpanite Paraiba',  hex: '#2DAFD4' },
    { id: 'alp-brown',name: 'Alp Brown',         hex: '#8B5E3C', shapes: ['round'], sizeMin: 1.00, sizeMax: 2.00 },
    { id: 'yz-green', name: 'YZ Green (SP Green)',hex: '#4A9B5C', shapes: ['round'], sizeMin: 1.00, sizeMax: 3.00 },
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
    { id: 'white', name: 'White Opal Rainbow Fire', hex: '#EDE9DF' },
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
