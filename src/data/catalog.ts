// Auto-generated from the frontend app/data.jsx (the source of truth).
// Real Eurostar catalogue metadata: 28 categories, shapes, tones, and unit-of-sale.
// Prices/variants are computed on the client from data.jsx; this module is the
// structural catalogue the API (and CRM/admin consumers) read from.

export type Unit = 'pc' | 'ct' | 'pkt' | 'strip';

export interface RealCategory { key: string; name: string; short: string; blurb: string; unit: Unit; origin: string; skipGrade: boolean; count: number; sortOrder: number; }
export interface RealShape { id: string; name: string; note: string; }
export interface RealTone { id: string; name: string; color: string; meta: string; }

export const CATEGORIES: RealCategory[] = [
  {
    "key": "laser",
    "name": "Eurostar Laser Engraved",
    "short": "Laser Engraved",
    "blurb": "Each stone bearing the Eurostar crest on the table.",
    "unit": "pkt",
    "origin": "Synthetic",
    "skipGrade": true,
    "count": 640,
    "sortOrder": 1
  },
  {
    "key": "moissanite",
    "name": "Moissanite Diamonds",
    "short": "Moissanite",
    "blurb": "DEF white & fancy color, VVS clarity. GRA-certified. Verifiable on the website.",
    "unit": "ct",
    "origin": "Synthetic",
    "skipGrade": false,
    "count": 1240,
    "sortOrder": 2
  },
  {
    "key": "alpanite",
    "name": "Alpanite Stones",
    "short": "Alpanite",
    "blurb": "Proprietary synthetic stones in a full colour range. 100% wax castable.",
    "unit": "pkt",
    "origin": "Synthetic",
    "skipGrade": false,
    "count": 480,
    "sortOrder": 3
  },
  {
    "key": "multisapphire",
    "name": "Multi Sapphires",
    "short": "Multi Sapphires",
    "blurb": "Natural & lab-grown Multi Sapphire strips.",
    "unit": "ct",
    "origin": "Synthetic",
    "skipGrade": false,
    "count": 820,
    "sortOrder": 4
  },
  {
    "key": "cabochon",
    "name": "Cabochons",
    "short": "Cabochons",
    "blurb": "Smooth-domed, unfaceted stones cut to size.",
    "unit": "pkt",
    "origin": "Natural / Synthetic",
    "skipGrade": false,
    "count": 360,
    "sortOrder": 5
  },
  {
    "key": "pearls",
    "name": "Pearls",
    "short": "Pearls",
    "blurb": "Natural China freshwater pearls & created pearls — wide collection.",
    "unit": "pkt",
    "origin": "Natural / Cultured",
    "skipGrade": false,
    "count": 540,
    "sortOrder": 6
  },
  {
    "key": "highdensity",
    "name": "High Density (HD) Zirconia",
    "short": "High Density",
    "blurb": "Dense CZ for casting — holds setting under heat. More weight for lesser thickness.",
    "unit": "pkt",
    "origin": "Zirconia",
    "skipGrade": false,
    "count": 1180,
    "sortOrder": 7
  },
  {
    "key": "corundum",
    "name": "Synthetic Corrundums",
    "short": "Corrundum",
    "blurb": "Synthetic / lab-grown gemstones with wide variety.",
    "unit": "pkt",
    "origin": "Synthetic",
    "skipGrade": false,
    "count": 760,
    "sortOrder": 8
  },
  {
    "key": "labgrown",
    "name": "Lab Grown / Created",
    "short": "Lab Grown",
    "blurb": "Gemstones with IGI certificate & natural inclusions like real gemstones.",
    "unit": "ct",
    "origin": "Synthetic",
    "skipGrade": false,
    "count": 2110,
    "sortOrder": 9
  },
  {
    "key": "labopal",
    "name": "Lab Created Opals",
    "short": "Lab Opals",
    "blurb": "Synthetic opal — varied colours across a wide spectrum.",
    "unit": "pkt",
    "origin": "Synthetic",
    "skipGrade": false,
    "count": 240,
    "sortOrder": 10
  },
  {
    "key": "opaque",
    "name": "Opaque Stones",
    "short": "Opaque",
    "blurb": "Red & green opaque stones that give the effect of natural gemstones.",
    "unit": "pkt",
    "origin": "Natural / Synthetic",
    "skipGrade": false,
    "count": 410,
    "sortOrder": 11
  },
  {
    "key": "beads",
    "name": "Beads",
    "short": "Beads",
    "blurb": "Faceted & smooth beads by the strand.",
    "unit": "ct",
    "origin": "Natural / Synthetic",
    "skipGrade": false,
    "count": 720,
    "sortOrder": 12
  },
  {
    "key": "cz",
    "name": "Color Cubic Zirconias",
    "short": "Color CZ",
    "blurb": "Calibrated CZ in 80+ shades. Heat-stable.",
    "unit": "pkt",
    "origin": "Zirconia",
    "skipGrade": false,
    "count": 4860,
    "sortOrder": 13
  },
  {
    "key": "whitecz",
    "name": "White Round Cubic Zirconia",
    "short": "White Round CZ",
    "blurb": "Calibrated white round CZ — heat-stable, fully calibrated.",
    "unit": "pkt",
    "origin": "Zirconia",
    "skipGrade": false,
    "count": 980,
    "sortOrder": 14
  },
  {
    "key": "whitefancy",
    "name": "White Fancy Shapes",
    "short": "White Fancy",
    "blurb": "Calibrated white CZ in fancy cuts — heat-stable, fully calibrated.",
    "unit": "pkt",
    "origin": "Zirconia",
    "skipGrade": false,
    "count": 760,
    "sortOrder": 15
  },
  {
    "key": "mop",
    "name": "Mother of Pearl / Synthetic",
    "short": "MOP",
    "blurb": "Natural & synthetic MOP, polished and cut to spec.",
    "unit": "pc",
    "origin": "Natural / Synthetic",
    "skipGrade": false,
    "count": 380,
    "sortOrder": 16
  },
  {
    "key": "navratna",
    "name": "Navratnas",
    "short": "Navratna",
    "blurb": "Nine-gem astrological sets, certified matched.",
    "unit": "pkt",
    "origin": "Natural / Synthetic",
    "skipGrade": false,
    "count": 95,
    "sortOrder": 17
  },
  {
    "key": "clover",
    "name": "Clover",
    "short": "Clover",
    "blurb": "Four-leaf clover motifs in natural & synthetic stones.",
    "unit": "pkt",
    "origin": "Natural / Synthetic",
    "skipGrade": false,
    "count": 240,
    "sortOrder": 18
  },
  {
    "key": "icecut",
    "name": "Ice Cut Stones",
    "short": "Ice Cut",
    "blurb": "Frosted ice-cut stones with a soft matte sparkle.",
    "unit": "pkt",
    "origin": "Synthetic",
    "skipGrade": false,
    "count": 160,
    "sortOrder": 19
  },
  {
    "key": "ourosa",
    "name": "Ourosa",
    "short": "Ourosa",
    "blurb": "Ourosa stones — sold by the packet of 10 gross (1,440 pcs).",
    "unit": "pkt",
    "origin": "Synthetic",
    "skipGrade": true,
    "count": 120,
    "sortOrder": 20
  },
  {
    "key": "coral",
    "name": "Milky Corals & Olives",
    "short": "Milky Corals & Olives",
    "blurb": "Milky coral & olive colours in a wide range of shapes, sizes and heights.",
    "unit": "pkt",
    "origin": "Synthetic",
    "skipGrade": true,
    "count": 180,
    "sortOrder": 21
  },
  {
    "key": "polki",
    "name": "Polki",
    "short": "Polki",
    "blurb": "Uncut polki in white, kundan & samosa foil.",
    "unit": "pkt",
    "origin": "Uncut",
    "skipGrade": false,
    "count": 140,
    "sortOrder": 22
  },
  {
    "key": "evileye",
    "name": "Evil Eye",
    "short": "Evil Eye",
    "blurb": "Real MOP with evil-eye motif, across shapes.",
    "unit": "pkt",
    "origin": "Natural",
    "skipGrade": true,
    "count": 90,
    "sortOrder": 23
  },
  {
    "key": "bracelet",
    "name": "Fancy Jewellery Bracelets",
    "short": "Bracelets",
    "blurb": "Rolex-style & Cartier-style fashion bracelets.",
    "unit": "pc",
    "origin": "Fashion",
    "skipGrade": false,
    "count": 60,
    "sortOrder": 24
  },
  {
    "key": "hollowmop",
    "name": "Hollow Shapes MOP",
    "short": "Hollow MOP",
    "blurb": "Hollow mother-of-pearl shapes in white & black onyx.",
    "unit": "pkt",
    "origin": "Natural",
    "skipGrade": false,
    "count": 120,
    "sortOrder": 25
  },
  {
    "key": "labwhitecorundum",
    "name": "Lab White Corundum",
    "short": "Lab White Corundum",
    "blurb": "Lab-grown white corundum across calibrated shapes.",
    "unit": "pkt",
    "origin": "Lab Grown",
    "skipGrade": true,
    "count": 110,
    "sortOrder": 26
  },
  {
    "key": "alex",
    "name": "Lab Grown Alexandrite",
    "short": "Alexandrite",
    "blurb": "Colour-change lab alexandrite across shapes.",
    "unit": "pkt",
    "origin": "Lab Grown",
    "skipGrade": true,
    "count": 85,
    "sortOrder": 27
  },
  {
    "key": "rajkot",
    "name": "Rajkot Mass Produced Zirconia",
    "short": "Rajkot Zirconia",
    "blurb": "Mass-produced white & colour zirconia — ordered & priced by the packet.",
    "unit": "pkt",
    "origin": "Zirconia",
    "skipGrade": false,
    "count": 0,
    "sortOrder": 28
  }
];

export const SHAPES: RealShape[] = [
  {
    "id": "round",
    "name": "Round",
    "note": "Brilliant, 57 facets"
  },
  {
    "id": "oval",
    "name": "Oval",
    "note": "Elongated brilliant"
  },
  {
    "id": "pear",
    "name": "Pear",
    "note": "Teardrop"
  },
  {
    "id": "emerald",
    "name": "Emerald",
    "note": "Step cut"
  },
  {
    "id": "radiant",
    "name": "Radiant",
    "note": "Beveled rectangle"
  },
  {
    "id": "marquise",
    "name": "Marquise",
    "note": "Boat shape"
  },
  {
    "id": "princess",
    "name": "Princess",
    "note": "Square brilliant"
  },
  {
    "id": "cushion",
    "name": "Cushion",
    "note": "Rounded square"
  },
  {
    "id": "asscher",
    "name": "Asscher",
    "note": "Square step"
  },
  {
    "id": "heart",
    "name": "Heart",
    "note": "Romantic cut"
  },
  {
    "id": "trillion",
    "name": "Trillion",
    "note": "Triangular"
  },
  {
    "id": "baguette",
    "name": "Baguette",
    "note": "Rectangular step"
  },
  {
    "id": "tapered",
    "name": "Tapered Baguette",
    "note": "Tapered step cut"
  },
  {
    "id": "fulldrilled",
    "name": "Full Drilled",
    "note": "Through-drilled for stringing"
  },
  {
    "id": "halfdrilled",
    "name": "Half Drilled",
    "note": "Half-drilled for posts & studs"
  },
  {
    "id": "undrilled",
    "name": "Undrilled",
    "note": "No hole — ready for setting"
  },
  {
    "id": "cabs",
    "name": "Cabs",
    "note": "Smooth half-dome cabochon"
  },
  {
    "id": "square",
    "name": "Square",
    "note": "By corner-to-corner"
  },
  {
    "id": "cube",
    "name": "Cube",
    "note": "3-D cube"
  },
  {
    "id": "pearoval",
    "name": "Pear / Oval",
    "note": "L × W"
  },
  {
    "id": "cabochon",
    "name": "Cabochon",
    "note": "Domed"
  },
  {
    "id": "clover",
    "name": "Clover",
    "note": "Four-leaf motif"
  },
  {
    "id": "shell",
    "name": "Shell",
    "note": "Carved shell"
  },
  {
    "id": "bellflower",
    "name": "Bell Flower",
    "note": "Floral motif"
  },
  {
    "id": "bulgari",
    "name": "Bulgari Motif",
    "note": "Signature motif"
  },
  {
    "id": "cutstones",
    "name": "Cut Stones",
    "note": "Oval, pear, marquise, round, etc."
  },
  {
    "id": "maniya",
    "name": "Maniya",
    "note": "Oval ball with hole"
  },
  {
    "id": "tyre-plain",
    "name": "Tyre Beads (Batti) · Plain",
    "note": "Batti · plain finish"
  },
  {
    "id": "tyre-fac",
    "name": "Tyre Beads (Batti) · Faceted",
    "note": "Batti · faceted finish"
  },
  {
    "id": "ballhole-plain",
    "name": "Ball with Hole · Plain",
    "note": "Drilled ball · plain"
  },
  {
    "id": "ballhole-fac",
    "name": "Ball with Hole · Faceted",
    "note": "Drilled ball · faceted"
  },
  {
    "id": "plain-beads",
    "name": "Plain Beads",
    "note": "Smooth drilled round bead"
  },
  {
    "id": "faceted-beads",
    "name": "Faceted Beads",
    "note": "Faceted drilled round bead"
  },
  {
    "id": "oval-maniya",
    "name": "Oval Maniya",
    "note": "Oval ball with hole"
  },
  {
    "id": "drops",
    "name": "Drops",
    "note": "Teardrop drilled bead"
  },
  {
    "id": "butterfly",
    "name": "Butterfly",
    "note": "Carved butterfly"
  },
  {
    "id": "flower5",
    "name": "5-Petal Flower",
    "note": "Drilled flower"
  },
  {
    "id": "star",
    "name": "Star",
    "note": "14 mm star"
  },
  {
    "id": "dholki",
    "name": "Dholki",
    "note": "Drum bead"
  },
  {
    "id": "tile",
    "name": "Tile",
    "note": "Flat tile"
  },
  {
    "id": "triangle",
    "name": "Triangle",
    "note": "Three-sided"
  },
  {
    "id": "oblong",
    "name": "Oblong Cushion",
    "note": "Elongated cushion"
  },
  {
    "id": "hexagon",
    "name": "Hexagon",
    "note": "Six-sided"
  }
];

export const TONES: RealTone[] = [
  {
    "id": "def-white",
    "name": "DEF White",
    "color": "#F2EFE8",
    "meta": "Colorless · D-F"
  },
  {
    "id": "royal-blue",
    "name": "Royal Blue",
    "color": "#1E3A8A",
    "meta": "Sapphire family"
  },
  {
    "id": "emperor-green",
    "name": "Emperor Green",
    "color": "#0E5C4A",
    "meta": "Emerald family"
  },
  {
    "id": "pigeon-blood",
    "name": "Pigeon Blood",
    "color": "#8B1E2E",
    "meta": "Ruby family"
  },
  {
    "id": "canary",
    "name": "Canary",
    "color": "#E2B43A",
    "meta": "Yellow sapphire"
  },
  {
    "id": "fairy-pink",
    "name": "Fairy Pink",
    "color": "#E6A4B4",
    "meta": "Pink sapphire"
  },
  {
    "id": "lavender",
    "name": "Lavender",
    "color": "#9C7DC2",
    "meta": "Purple corundum"
  },
  {
    "id": "tsavourite",
    "name": "Tsavourite",
    "color": "#3E8E4F",
    "meta": "Garnet green"
  },
  {
    "id": "rubylite",
    "name": "Rubylite",
    "color": "#B43A5C",
    "meta": "Pink tourmaline"
  },
  {
    "id": "cornflower",
    "name": "Cornflower",
    "color": "#5B7BC4",
    "meta": "Blue sapphire"
  }
];
