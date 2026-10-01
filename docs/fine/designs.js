/*
 * Eurostar Fine — launch collection.
 *
 * weight14 = estimated finished gold weight in 14K (grams). 18K is derived
 * (denser alloy). Replace with the karigar's CAD weight once each design is
 * modelled — the price follows automatically.
 *
 * stones[] slots:
 *   { role, choose: [gemIds], shape, size, qty }  customer picks the gem
 *   { role, gem, shape, size, qty }               fixed gem
 *   { role, mix: [gemIds], shape, size, qty }     qty spread across colours
 * shape/size use the trade shop's own ids so prices come straight from it.
 */
(function (root) {
  const LAB_CENTRE = ['moissanite', 'ruby', 'emerald', 'sapphire', 'pink', 'padparadscha', 'lavender', 'paraiba', 'canary'];
  const RAINBOW = ['ruby', 'hotpink', 'alexandrite', 'sapphire', 'emerald'];
  const CLOVERS = ['mopClover', 'onyxClover', 'agateClover', 'carnClover', 'pinkClover'];

  const COLLECTIONS = [
    { id: 'solitaire', name: 'Solitaire', line: 'One stone, perfectly held.',
      blurb: 'Moissanite and lab-grown centre stones in quiet, precise settings. Built for proposals, anniversaries, and every day after.', tone: '#EEF0F2' },
    { id: 'spectrum', name: 'Spectrum', line: 'Colour, in a straight line.',
      blurb: 'Rainbow-set lab-grown sapphires, rubies and emeralds. Wear one band or stack them all.', tone: '#F3ECEE' },
    { id: 'talisman', name: 'Talisman', line: 'Small charms, old meanings.',
      blurb: 'Evil eye, four-leaf clover and the nine planets of the navratna, made light enough to never take off.', tone: '#ECEFF5' },
    { id: 'lumiere', name: 'Lumière', line: 'The soft glow of nacre.',
      blurb: 'Mother of pearl, pearls and lab opal, set in gold that lets the light do the talking.', tone: '#F4F1EA' },
    { id: 'heritage', name: 'Heritage Minimal', line: 'Polki, without the weight.',
      blurb: 'Indian heritage cuts and bezels, redrawn with modern restraint for everyday wear.', tone: '#F3EEE4' },
    { id: 'everyday', name: 'Everyday Gold', line: 'Fine jewellery for Tuesdays.',
      blurb: 'Nose pins, huggies and initials in 14K. The easiest way to start a fine-jewellery wardrobe.', tone: '#F2EFE9' },
  ];

  const KINDS = { ring: 'Rings', earrings: 'Earrings', pendant: 'Necklaces', bracelet: 'Bracelets', nosepin: 'Nose Pins' };

  const D = (o) => o;
  const DESIGNS = [
    // ------------------------------------------------------------ Solitaire
    D({ id: 'aurelia-solitaire', name: 'Aurelia Solitaire Ring', collection: 'solitaire', kind: 'ring', weight14: 2.4,
      story: 'A six-prong cathedral setting lifts a 6.5 mm round brilliant — about one carat in moissanite — above a slim knife-edge band.',
      art: { type: 'solitaire', shape: 'round' },
      stones: [{ role: 'Centre', choose: LAB_CENTRE, shape: 'round', size: '6.5mm', qty: 1 }] }),
    D({ id: 'ovale-halo', name: 'Ovale Hidden-Halo Ring', collection: 'solitaire', kind: 'ring', weight14: 2.8,
      story: 'An elongated oval with a ring of tiny moissanite tucked beneath it — invisible from above, a flash of light from the side.',
      art: { type: 'solitaire', shape: 'oval', halo: true },
      stones: [{ role: 'Centre', choose: LAB_CENTRE, shape: 'oval', size: '6x8mm', qty: 1 },
        { role: 'Hidden halo', gem: 'moissanite', shape: 'round', size: '1.3mm', qty: 18 }] }),
    D({ id: 'larme-pear', name: 'Larme Pear Ring', collection: 'solitaire', kind: 'ring', weight14: 2.3,
      story: 'Larme means "teardrop". A 6 × 8 mm pear held by a V-prong at its point, on a softly tapered band.',
      art: { type: 'solitaire', shape: 'pear' },
      stones: [{ role: 'Centre', choose: LAB_CENTRE, shape: 'pear', size: '6x8mm', qty: 1 }] }),
    D({ id: 'trinity-three-stone', name: 'Trinity Three-Stone Ring', collection: 'solitaire', kind: 'ring', weight14: 3.1,
      story: 'Past, present, future: an oval centre flanked by two moissanite pears that point gently inward.',
      art: { type: 'trilogy' },
      stones: [{ role: 'Centre', choose: LAB_CENTRE, shape: 'oval', size: '5x7mm', qty: 1 },
        { role: 'Side stones', gem: 'moissanite', shape: 'pear', size: '3x5mm', qty: 2 }] }),
    D({ id: 'etoile-pendant', name: 'Étoile Solitaire Pendant', collection: 'solitaire', kind: 'pendant', weight14: 2.6,
      story: 'A single 6 mm brilliant floating on a fine 16–18" cable chain. The one necklace that goes with everything.',
      art: { type: 'pendant', shape: 'round' },
      stones: [{ role: 'Centre', choose: LAB_CENTRE, shape: 'round', size: '6mm', qty: 1 }] }),
    D({ id: 'point-studs', name: 'Point Solitaire Studs', collection: 'solitaire', kind: 'earrings', weight14: 1.2,
      story: 'Classic four-prong studs with 6 mm stones (about 0.8 ct each in moissanite), on screw-back posts.',
      art: { type: 'studs', shape: 'round', size: 82 },
      stones: [{ role: 'Pair', choose: LAB_CENTRE, shape: 'round', size: '6mm', qty: 2 }] }),
    D({ id: 'riviera-tennis', name: 'Riviera Tennis Bracelet', collection: 'solitaire', kind: 'bracelet', weight14: 8.5,
      story: 'Fifty-two 2.5 mm stones in individual four-prong baskets, hinged so it moves like water. 7 inches with a box clasp.',
      art: { type: 'tennis' },
      stones: [{ role: 'Line', choose: ['moissanite', 'ruby', 'emerald', 'sapphire'], shape: 'round', size: '2.5mm', qty: 52 }] }),
    D({ id: 'eternity-band', name: 'Eternity Band', collection: 'solitaire', kind: 'ring', weight14: 2.6,
      story: 'Twenty-four 2 mm stones set all the way round in a shared-prong band. Wear alone or beside a solitaire.',
      art: { type: 'eternity', full: true, size: 20 },
      stones: [{ role: 'All round', choose: ['moissanite', 'ruby', 'emerald', 'sapphire'], shape: 'round', size: '2mm', qty: 24 }] }),

    // ------------------------------------------------------------ Spectrum
    D({ id: 'spectrum-half-eternity', name: 'Spectrum Half-Eternity', collection: 'spectrum', kind: 'ring', weight14: 2.2,
      story: 'Eleven lab-grown stones graded from ruby through pink and violet to sapphire and emerald.',
      art: { type: 'eternity', size: 22 },
      stones: [{ role: 'Rainbow', mix: RAINBOW, shape: 'round', size: '2mm', qty: 11 }] }),
    D({ id: 'spectrum-huggies', name: 'Spectrum Huggies', collection: 'spectrum', kind: 'earrings', weight14: 2.4,
      story: 'Snug 12 mm hoops with seven stones each, so a little colour shows from every angle.',
      art: { type: 'huggies' },
      stones: [{ role: 'Rainbow', mix: RAINBOW, shape: 'round', size: '2mm', qty: 14 }] }),
    D({ id: 'ombre-stack', name: 'Ombré Stack · Set of 3', collection: 'spectrum', kind: 'ring', weight14: 4.2,
      story: 'Three slim bands — ruby, sapphire, emerald — designed to sit flush together or be worn on separate fingers.',
      art: { type: 'stack' },
      stones: [{ role: 'Bands', mix: ['ruby', 'sapphire', 'emerald'], shape: 'round', size: '1.5mm', qty: 27 }] }),
    D({ id: 'rainbow-tennis', name: 'Rainbow Tennis Bracelet', collection: 'spectrum', kind: 'bracelet', weight14: 8.0,
      story: 'Fifty 2.5 mm stones cycling through the rainbow. The bracelet everyone asks about.',
      art: { type: 'tennis' },
      stones: [{ role: 'Rainbow', mix: RAINBOW, shape: 'round', size: '2.5mm', qty: 50 }] }),
    D({ id: 'prism-bar', name: 'Prism Bar Pendant', collection: 'spectrum', kind: 'pendant', weight14: 2.2,
      story: 'A vertical gold bar with five flush-set stones, worn on an 18" chain.',
      art: { type: 'bar' },
      stones: [{ role: 'Rainbow', mix: RAINBOW, shape: 'round', size: '2mm', qty: 5 }] }),
    D({ id: 'prism-climbers', name: 'Prism Ear Climbers', collection: 'spectrum', kind: 'earrings', weight14: 1.8,
      story: 'Graduated stones that climb the curve of the ear. No second piercing needed.',
      art: { type: 'climbers' },
      stones: [{ role: 'Rainbow', mix: RAINBOW, shape: 'round', size: '2mm', qty: 10 }] }),

    // ------------------------------------------------------------ Talisman
    D({ id: 'nazar-pendant', name: 'Nazar Halo Pendant', collection: 'talisman', kind: 'pendant', weight14: 2.4,
      story: 'An 8 mm evil eye framed by a halo of sixteen moissanite: protection, with a little sparkle.',
      art: { type: 'pendant', motif: 'evileye', halo: true },
      stones: [{ role: 'Evil eye', gem: 'evileye', shape: 'round', size: '8mm', qty: 1 },
        { role: 'Halo', gem: 'moissanite', shape: 'round', size: '1.3mm', qty: 16 }] }),
    D({ id: 'nazar-studs', name: 'Nazar Studs', collection: 'talisman', kind: 'earrings', weight14: 1.0,
      story: 'Tiny 6 mm evil eyes in a polished gold rim. Everyday protection.',
      art: { type: 'studs', motif: 'evileye', size: 70 },
      stones: [{ role: 'Pair', gem: 'evileye', shape: 'round', size: '6mm', qty: 2 }] }),
    D({ id: 'nazar-station', name: 'Nazar Station Bracelet', collection: 'talisman', kind: 'bracelet', weight14: 3.2,
      story: 'Five evil eyes spaced along a fine cable chain, adjustable from 6.5 to 7.5 inches.',
      art: { type: 'station', motif: 'evileye' },
      stones: [{ role: 'Stations', gem: 'evileye', shape: 'round', size: '6mm', qty: 5 }] }),
    D({ id: 'lucky-clover-pendant', name: 'Lucky Clover Pendant', collection: 'talisman', kind: 'pendant', weight14: 2.8,
      story: 'A 12 mm four-leaf clover in natural stone, outlined in gold with a single gold bead at its heart.',
      art: { type: 'pendant', motif: 'clover' },
      stones: [{ role: 'Clover', choose: CLOVERS, shape: 'clover', size: '12mm', qty: 1 }] }),
    D({ id: 'clover-station', name: 'Clover Station Bracelet', collection: 'talisman', kind: 'bracelet', weight14: 4.5,
      story: 'Five 10 mm clovers on a fine chain. Pick the stone that suits you.',
      art: { type: 'station', motif: 'clover' },
      stones: [{ role: 'Clovers', choose: CLOVERS, shape: 'clover', size: '10mm', qty: 5 }] }),
    D({ id: 'clover-studs', name: 'Clover Studs', collection: 'talisman', kind: 'earrings', weight14: 1.6,
      story: 'Two 10 mm clovers on screw-back posts. They match the pendant and the bracelet.',
      art: { type: 'studs', motif: 'clover', size: 104 },
      stones: [{ role: 'Pair', choose: CLOVERS, shape: 'clover', size: '10mm', qty: 2 }] }),
    D({ id: 'navratna-ring', name: 'Navratna Ring', collection: 'talisman', kind: 'ring', weight14: 3.0,
      story: 'Nine gems for nine planets, set in the traditional order with ruby (the sun) at the centre. Made smaller and lighter than tradition.',
      art: { type: 'navring' },
      stones: [{ role: 'Navratna set', choose: ['navratna', 'navratnaNat'], shape: 'round', size: '2.5mm', qty: 1 }] }),
    D({ id: 'navratna-pendant', name: 'Navratna Pendant', collection: 'talisman', kind: 'pendant', weight14: 2.6,
      story: 'The nine planetary gems in a round gold medallion on a fine chain.',
      art: { type: 'pendant', motif: 'navratna' },
      stones: [{ role: 'Navratna set', choose: ['navratna', 'navratnaNat'], shape: 'round', size: '3mm', qty: 1 }] }),

    // ------------------------------------------------------------ Lumière
    D({ id: 'luna-pearl-huggies', name: 'Luna Pearl Huggies', collection: 'lumiere', kind: 'earrings', weight14: 2.2,
      story: 'Moissanite-set huggies with a removable 6 mm pearl drop. Two looks in one pair.',
      art: { type: 'huggies', drop: true },
      stones: [{ role: 'Drops', gem: 'pearl', shape: 'halfdrilled', size: '6mm', qty: 2 },
        { role: 'Hoops', gem: 'moissanite', shape: 'round', size: '1.3mm', qty: 14 }] }),
    D({ id: 'perle-pendant', name: 'Perle Pendant', collection: 'lumiere', kind: 'pendant', weight14: 2.0,
      story: 'A single 8 mm pearl on a delicate cap and an 18" chain. Quiet and timeless.',
      art: { type: 'pendant', motif: 'pearl' },
      stones: [{ role: 'Pearl', gem: 'pearl', shape: 'halfdrilled', size: '8mm', qty: 1 }] }),
    D({ id: 'opal-signet', name: 'Opal Signet', collection: 'lumiere', kind: 'ring', weight14: 4.2,
      story: 'A modern oval signet inlaid with a 10 × 8 mm lab opal full of rainbow fire.',
      art: { type: 'signet', motif: 'opal' },
      stones: [{ role: 'Inlay', gem: 'opal', shape: 'oval', size: '10x8mm', qty: 1 }] }),
    D({ id: 'opal-studs', name: 'Opal Bezel Studs', collection: 'lumiere', kind: 'earrings', weight14: 1.1,
      story: '5 mm lab-opal domes in a smooth gold bezel. A flash of colour as you move.',
      art: { type: 'studs', motif: 'opal', size: 70 },
      stones: [{ role: 'Pair', gem: 'opal', shape: 'round', size: '5mm', qty: 2 }] }),
    D({ id: 'nacre-disc', name: 'Nacre Disc Necklace', collection: 'lumiere', kind: 'pendant', weight14: 2.6,
      story: 'A 12 mm disc of mother of pearl in a thin gold rim, in white or black nacre.',
      art: { type: 'pendant', motif: 'disc' },
      stones: [{ role: 'Disc', choose: ['mop', 'blackMop'], shape: 'round', size: '12x2mm', qty: 1 }] }),
    D({ id: 'pearl-drops', name: 'Pearl Drop Earrings', collection: 'lumiere', kind: 'earrings', weight14: 1.6,
      story: 'A 3 mm moissanite stud with a 7 mm pearl swinging below. For weddings, and for everything after.',
      art: { type: 'drops' },
      stones: [{ role: 'Studs', gem: 'moissanite', shape: 'round', size: '3mm', qty: 2 },
        { role: 'Pearls', gem: 'pearl', shape: 'halfdrilled', size: '7mm', qty: 2 }] }),

    // ------------------------------------------------------------ Heritage Minimal
    D({ id: 'polki-band', name: 'Polki Band', collection: 'heritage', kind: 'ring', weight14: 3.0,
      story: 'Nine uncut polki set close together in a wide, flat band. Modern lines, old-world glow.',
      art: { type: 'polkiband' },
      stones: [{ role: 'Polki', gem: 'polki', shape: 'round', size: '2.5mm', qty: 9 }] }),
    D({ id: 'polki-studs', name: 'Polki Studs', collection: 'heritage', kind: 'earrings', weight14: 1.4,
      story: '5 mm polki in a thin gold collet. Small enough for every day, still rooted in tradition.',
      art: { type: 'studs', motif: 'polki', size: 76 },
      stones: [{ role: 'Pair', gem: 'polki', shape: 'round', size: '5mm', qty: 2 }] }),
    D({ id: 'polki-pendant', name: 'Polki Drop Pendant', collection: 'heritage', kind: 'pendant', weight14: 2.6,
      story: 'A 6 × 8 mm pear polki on a slim bail and an 18" chain.',
      art: { type: 'pendant', motif: 'polki' },
      stones: [{ role: 'Polki', gem: 'polki', shape: 'pear', size: '6x8mm', qty: 1 }] }),
    D({ id: 'raani-bezel', name: 'Raani Bezel Ring', collection: 'heritage', kind: 'ring', weight14: 3.6,
      story: 'A 7 × 9 mm oval wrapped in a soft gold bezel, after the court rings of Rajasthan.',
      art: { type: 'bezelring' },
      stones: [{ role: 'Centre', choose: ['ruby', 'emerald', 'sapphire', 'padparadscha', 'paraiba'], shape: 'oval', size: '7x9mm', qty: 1 }] }),

    // ------------------------------------------------------------ Everyday Gold
    D({ id: 'bindu-nose-pin', name: 'Bindu Nose Pin', collection: 'everyday', kind: 'nosepin', weight14: 0.3,
      story: 'A single 2 mm stone in a gold bezel, on a comfortable screw stem.',
      art: { type: 'nosepin' },
      stones: [{ role: 'Stone', choose: ['moissanite', 'ruby', 'emerald', 'sapphire'], shape: 'round', size: '2mm', qty: 1 }] }),
    D({ id: 'everyday-huggies', name: 'Everyday Huggies', collection: 'everyday', kind: 'earrings', weight14: 1.8,
      story: 'Twelve tiny moissanite in a 10 mm hoop. The pair you never take off.',
      art: { type: 'huggies' },
      stones: [{ role: 'Hoops', gem: 'moissanite', shape: 'round', size: '1.3mm', qty: 12 }] }),
    D({ id: 'mangal-minimal', name: 'Mangal Minimal Necklace', collection: 'everyday', kind: 'pendant', weight14: 3.0,
      story: 'A modern mangalsutra: two black mother-of-pearl beads and one 4 mm moissanite on a fine gold chain.',
      art: { type: 'mangal' },
      stones: [{ role: 'Centre', gem: 'moissanite', shape: 'round', size: '4mm', qty: 1 },
        { role: 'Black beads', gem: 'blackMop', shape: 'round', size: '4x2mm', qty: 2 }] }),
    D({ id: 'initial-pendant', name: 'Initial Pendant', collection: 'everyday', kind: 'pendant', weight14: 1.6,
      story: 'Your letter in our serif, with a single bezel-set moissanite. Choose any initial A–Z.',
      art: { type: 'letter' }, letters: true,
      stones: [{ role: 'Accent', gem: 'moissanite', shape: 'round', size: '1.5mm', qty: 1 }] }),
  ];

  root.FineDesigns = { COLLECTIONS, KINDS, DESIGNS };
})(typeof window !== 'undefined' ? window : globalThis);
