// lms-data.jsx — Eurostar LMS / recruitment sample data

const LMS_STAGES = [
  // Creating a login is not the same as applying. Someone who has registered
  // but not yet submitted the Apply Now form sits here, so the office can see
  // at a glance who still owes an application instead of every new account
  // showing up as "Applied" with no city, experience or CV against it.
  { id: 'registered',  label: 'Registered',  color: '#6B7280' },
  { id: 'applied',     label: 'Applied',     color: '#2563EB' },
  { id: 'screening',   label: 'Screening',   color: '#7C3AED' },
  { id: 'training',    label: 'In Training', color: '#B7791F' },
  { id: 'testing',     label: 'Test Taken',  color: '#0891B2' },
  { id: 'recommended', label: 'Recommended', color: '#B7791F' },
  { id: 'hired',       label: 'Hired',       color: '#15803D' },
  { id: 'rejected',    label: 'Rejected',    color: '#B91C1C' },
];

const LMS_SOURCES = [
  { id: 'google',    label: 'Google',    icon: '🔍' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: '💼' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'referral',  label: 'Referral',  icon: '🤝' },
];

// Candidates / applicants
//  Lifecycle fields: unlockedOn (ISO date training+test window opened, null = locked),
//  score (test %, null = not taken). Stage drives everything else.
const LMS_CANDIDATES = [
  { id: 'C1', n: 1, candId: 'EC-1001', name: 'Anuj Gupta',  phone: '7710065480', email: 'admin@gmail.com', city: 'Mumbai',    state: 'Maharashtra', stage: 'applied',     score: null, source: 'google',    applied: '11 Jun 2026 · 04:11 PM', repId: '', exp: '4 yrs', avatar: 'AG', hue: 16,  unlockedOn: null,         testUnlockedOn: null, testConsumed: false, resume: 'Anuj_Gupta_CV.pdf', screenResult: null, screenNote: '', screenRating: 0, attempts: [], rejectReason: '', watched: [], onboarding: { confidentiality: false, docs: {}, offer: false, crmSynced: false } },
  { id: 'C2', n: 2, candId: 'EC-1002', name: 'Test 4',      phone: '9595492549', email: 'test4@gmail.com', city: 'City',      state: 'Kerala',      stage: 'recommended', score: 100,  source: 'linkedin',  applied: '06 Jun 2026 · 03:02 PM', repId: '', exp: '4 yrs', avatar: 'T4', hue: 350, unlockedOn: '2026-06-16', testUnlockedOn: '2026-06-18', testConsumed: true, resume: 'Test4_Resume.pdf', screenResult: 'pass', screenNote: 'Confident, good product knowledge. Strong field experience in Kochi.', screenRating: 5, attempts: [{ n: 1, score: 100, date: '18 Jun 2026', passed: true }], rejectReason: '', watched: ['v1','v2','v3','v4'], onboarding: { confidentiality: false, docs: {}, offer: false, crmSynced: false } },
  { id: 'C3', n: 3, candId: 'EC-1003', name: 'test 3',      phone: '5646576546', email: 'test3@gmail.com', city: 'Jysitsj',   state: 'Karnataka',   stage: 'training',    score: null, source: 'linkedin',  applied: '06 Jun 2026 · 12:47 PM', repId: '', exp: '2 yrs', avatar: 'T3', hue: 220, unlockedOn: '2026-06-19', testUnlockedOn: null, testConsumed: false, resume: 'test3_cv.pdf', screenResult: 'pass', screenNote: 'Decent communication. Needs product training.', screenRating: 3, attempts: [], rejectReason: '', watched: ['v1','v2'], onboarding: { confidentiality: false, docs: {}, offer: false, crmSynced: false } },
  { id: 'C4', n: 4, candId: 'EC-1004', name: 'Test 2',      phone: '8524525635', email: 'test2@gmail.com', city: 'Hyderabad', state: 'Karnataka',   stage: 'training',    score: null, source: 'instagram', applied: '06 Jun 2026 · 11:26 AM', repId: '', exp: '1 yr',  avatar: 'T2', hue: 28,  unlockedOn: '2026-06-08', testUnlockedOn: null, testConsumed: false, resume: 'Test2.pdf', screenResult: 'pass', screenNote: 'Eager, junior. Window expired — needs re-unlock.', screenRating: 3, attempts: [], rejectReason: '', watched: ['v1'], onboarding: { confidentiality: false, docs: {}, offer: false, crmSynced: false } },
  { id: 'C5', n: 5, candId: 'EC-1005', name: 'Test 1',      phone: '2542365215', email: 'test1@gmail.com', city: 'Ranchi',    state: 'Jharkhand',   stage: 'hired',       score: 75,   source: 'google',    applied: '06 Jun 2026 · 11:13 AM', repId: 'ES-REP-JH-0001', tempPassword: 'Ruby@4827', exp: '3 yrs', avatar: 'T1', hue: 330, unlockedOn: '2026-06-01', testUnlockedOn: '2026-06-03', testConsumed: true, resume: 'Test1_CV.pdf', screenResult: 'pass', screenNote: 'Experienced, strong Jharkhand network. Hired.', screenRating: 4, attempts: [{ n: 1, score: 60, date: '03 Jun 2026', passed: false }, { n: 2, score: 75, date: '05 Jun 2026', passed: true }], rejectReason: '', watched: ['v1','v2','v3','v4'], onboarding: { confidentiality: true, offer: true, crmSynced: true,
    photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='%23DCE7E1'/><circle cx='60' cy='46' r='22' fill='%237A8C84'/><path d='M22 112a38 32 0 0 1 76 0z' fill='%237A8C84'/></svg>",
    aadhaarImg: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='120'><rect width='180' height='120' rx='8' fill='%23FBF3E2'/><rect width='180' height='22' fill='%23C9602A'/><text x='10' y='15' font-family='sans-serif' font-size='11' fill='white'>AADHAAR</text><rect x='12' y='34' width='40' height='52' fill='%23D9C9A8'/><text x='60' y='52' font-family='sans-serif' font-size='12' fill='%23555'>Rajeev Kumar Singh</text><text x='60' y='74' font-family='monospace' font-size='13' fill='%23222'>2345 6789 0123</text></svg>",
    panImg: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='120'><rect width='180' height='120' rx='8' fill='%23E8F0FB'/><rect width='180' height='22' fill='%231D4ED8'/><text x='10' y='15' font-family='sans-serif' font-size='10.5' fill='white'>INCOME TAX - PAN</text><text x='14' y='56' font-family='sans-serif' font-size='12' fill='%23555'>RAJEEV KUMAR SINGH</text><text x='14' y='80' font-family='monospace' font-size='15' fill='%23222'>ABCPS1234K</text></svg>",
    bank: { acc: '50100247889012', holder: 'Rajeev Kumar Singh', bankName: 'HDFC Bank', ifsc: 'HDFC0001234' } } },
];

// ----- Lifecycle rules (single source of truth, shared with CRM at handoff) -----
const LMS_TODAY = new Date('2026-06-22T10:00:00');
const LMS_PASS_PCT = 70;      // test pass mark
const LMS_WINDOW_DAYS = 10;   // training stays unlocked for 10 days, then re-lock
const LMS_TRAIN_DAYS = 7;     // prospect should finish training within 7 days
const LMS_TEST_DAYS = 2;      // once test is unlocked, must be taken within 2 days
// How long a booked screening slot stays joinable, from its start time. The
// Screening page books 15–20 minute slots, so the join link dies with the slot.
const LMS_SLOT_MINUTES = 20;
const LMS_STATE_CODE = { Maharashtra:'MH', Kerala:'KL', Karnataka:'KA', Jharkhand:'JH', Gujarat:'GJ', 'Tamil Nadu':'TN', Telangana:'TG', Rajasthan:'RJ', Delhi:'DL', 'West Bengal':'WB', 'Uttar Pradesh':'UP', 'Madhya Pradesh':'MP' };

function lmsDaysBetween(a, b) { return Math.floor((b - a) / 86400000); }

/**
 * Where a candidate belongs when they are NOT inside a training window.
 *
 * Opening or closing a window is scheduling — it must never be the thing that
 * decides how far along someone is. Unlocking training used to set the stage to
 * "In Training" outright, and locking it again left that stage behind, so a bare
 * registration ended up reading "In Training" next to a locked window.
 */
function lmsBaseStage(c) {
  if (!c) return 'registered';
  if (c.screenResult && c.screenResult !== 'fail') return 'screening';
  return (c.city && c.state && c.exp) ? 'applied' : 'registered';
}

// The candidate's TRUE current stage, derived from what has actually happened
// (screening result, training/test windows, score, hire) rather than the stored
// `stage` field, which lags — unlocking training or passing screening does not
// always rewrite it. Every place that DISPLAYS a stage (candidate status, admin
// stage pill, the mobile app) must use this so the candidate and the office
// never see different stages for the same person.
function lmsEffectiveStage(c) {
  if (!c) return 'registered';
  if (c.stage === 'rejected') return 'rejected';
  if (c.stage === 'hired' || c.repId) return 'hired';
  if (c.score != null && c.score >= LMS_PASS_PCT) return 'recommended';
  if (c.score != null || c.testUnlockedOn || c.testConsumed) return 'testing';
  if (c.unlockedOn || (c.watched || []).length > 0) return 'training';
  if (c.screenResult && c.screenResult !== 'fail') return 'screening';
  return (c.city && c.state && c.exp) ? 'applied' : 'registered';
}

// Has the candidate actually started the training/testing part of the journey?
// If so, closing a window must not walk their stage backwards.
function lmsHasProgressed(c) {
  if (!c) return false;
  return c.score != null || (c.attempts || []).length > 0 || (c.watched || []).length > 0;
}

// Did this candidate actually sit the assessment? A stage of "recommended" is
// not proof on its own — an office edit, or a score left on the row by anything
// other than a real sitting, would put someone in the Approval Queue who has
// never answered a question. A finished attempt is the evidence: the one shot
// used up, an attempt on file, or a submitted test run.
function lmsTookTest(c) {
  if (!c) return false;
  if (c.testConsumed) return true;
  if (Array.isArray(c.attempts) && c.attempts.length > 0) return true;
  return !!(c.testRun && c.testRun.submittedAt);
}

// Who genuinely belongs in the Approval Queue: cleared the pass mark, in a real
// sitting, and not already decided on.
function lmsAwaitingApproval(c) {
  return !!c && c.stage === 'recommended' && lmsTookTest(c) && c.score != null && c.score >= LMS_PASS_PCT;
}

// Training access window status for a candidate.
function lmsWindow(c) {
  if (c.stage === 'hired') return { state: 'hired', daysLeft: 0 };
  if (!c.unlockedOn) return { state: 'locked', daysLeft: 0 };
  const used = lmsDaysBetween(new Date(c.unlockedOn), LMS_TODAY);
  const left = LMS_WINDOW_DAYS - used;
  if (left <= 0) return { state: 'expired', daysLeft: 0 };
  return { state: 'open', daysLeft: left };
}

// Test access window — unlocked separately from training. Once unlocked the
// prospect must take it within LMS_TEST_DAYS (2). The test is one-shot: starting
// then leaving marks it 'used' until an admin grants a re-test.
function lmsTestWindow(c) {
  if (c.stage === 'hired') return { state: 'hired', daysLeft: 0 };
  if (c.score != null) return { state: 'done', daysLeft: 0 };
  if (c.testConsumed) return { state: 'used', daysLeft: 0 };
  if (!c.testUnlockedOn) return { state: 'locked', daysLeft: 0 };
  const used = lmsDaysBetween(new Date(c.testUnlockedOn), LMS_TODAY);
  const left = LMS_TEST_DAYS - used;
  if (left <= 0) return { state: 'expired', daysLeft: 0 };
  return { state: 'open', daysLeft: left };
}

// Permanent Rep ID — generated once on hire, NEVER reassigned. Same ID is the
// primary key that links a rep across LMS and CRM.
function lmsNextRepId(cands, c) {
  if (c.repId) return c.repId; // already assigned — keep it forever
  const sc = LMS_STATE_CODE[c.state] || 'IN';
  let max = 0;
  cands.forEach(x => { const m = /ES-REP-[A-Z]{2}-(\d+)/.exec(x.repId || ''); if (m) max = Math.max(max, +m[1]); });
  return `ES-REP-${sc}-${String(max + 1).padStart(4, '0')}`;
}

// One-time temporary Sales App password, issued with the Rep ID on hire.
// The rep is prompted to change it on first login (handled by Bright Code).
function lmsGenPassword() {
  const words = ['Gem', 'Star', 'Ruby', 'Jade', 'Opal', 'Pearl', 'Topaz'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}@${n}`;
}

// Training modules + videos
// Training curriculum — reorganised into a logical learning arc:
//   Foundations & products (M1–M4) → Market & customer (M5–M6) →
//   Selling craft (M7–M9) → The apps/tools (M10–M13) →
//   Commercials & follow-through (M14–M16) → Being a Eurostar rep (M17–M18).
// NOTE: the commission module MUST stay M16 (its notes are generated from
// LMS_COMPENSATION and written to LMS_MODULE_NOTES.M16 by the admin editor).
const LMS_MODULES = [
  { id: 'M1', code: 'M1', title: 'Welcome to Eurostar', mandatory: true,
    videos: [ { id: 'v1', title: 'Who we are — 40 years of trust', dur: '04:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M2', code: 'M2', title: 'The Product Range — Overview', mandatory: true,
    videos: [ { id: 'v2', title: 'Product families & the four ways we sell', dur: '10:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M3', code: 'M3', title: 'Product Knowledge — Deep Dive', mandatory: true,
    videos: [ { id: 'v3', title: 'Know every product — grade by grade', dur: '16:00', added: '07 Jul 2026', mandatory: true } ] },
  { id: 'M4', code: 'M4', title: 'Hero Product — White Round CZ', mandatory: true,
    videos: [ { id: 'v4', title: 'The grades & the metal-first decision tree', dur: '12:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M5', code: 'M5', title: 'Knowing Your Customer', mandatory: true,
    videos: [ { id: 'v5', title: 'Who buys, and what they care about', dur: '07:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M6', code: 'M6', title: 'Marketing & Building Your Territory', mandatory: true,
    videos: [ { id: 'v6', title: 'Finding customers & covering your market', dur: '09:00', added: '07 Jul 2026', mandatory: true } ] },
  { id: 'M7', code: 'M7', title: 'The Eurostar Selling Strategy', mandatory: true,
    videos: [ { id: 'v7', title: 'Relationship first, white round next', dur: '09:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M8', code: 'M8', title: 'The Sales Conversation', mandatory: true,
    videos: [ { id: 'v8', title: 'From "hello" to a written order', dur: '14:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M9', code: 'M9', title: 'Handling Objections', mandatory: true,
    videos: [ { id: 'v9', title: 'Turn "no" into "let me try"', dur: '08:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M10', code: 'M10', title: 'The Sales App — Ordering', mandatory: true,
    videos: [ { id: 'v10', title: 'Show, quote & order on the app', dur: '14:00', added: '27 May 2026', mandatory: true } ],
    practice: {
      app: 'sales',
      src: 'Eurostar Sales website.html',
      label: 'Practice: the Sales App',
      intro: 'Browse the catalog and place a practice order. Nothing here is sent to the office.',
      tasks: [
        'Open White Round Cubic Zirconia and choose the GQ grade',
        'Add 2 packets of 1.00 mm and 1 packet of 1.50 mm to the cart',
        'Open the cart and tap Get Proforma',
        'Tap a product photo to zoom it full-screen, then close it',
        'Find a size marked “Sold out” and confirm you cannot add it',
        'Raise an RFQ for a special item (remember the ₹10,000 minimum)',
      ],
    } },
  { id: 'M11', code: 'M11', title: 'The Rep CRM — Your Day', mandatory: true,
    videos: [ { id: 'v11', title: 'Your daily command centre', dur: '12:00', added: '27 May 2026', mandatory: true } ],
    practice: {
      app: 'crm',
      src: 'Eurostar CRM.html?role=rep',
      label: 'Practice: the Rep CRM',
      intro: 'This is your daily command centre. Try the Quick Actions and add a dummy customer.',
      tasks: [
        'From My Desk, tap each of the four Quick Actions',
        'Use Add customer to register a dummy account',
        'Open Pipeline & follow-ups and advance one customer a stage',
        'Open My commission and read how earnings are shown',
        'Find the escalation card (Area Sales Manager & Sales Head)',
      ],
    } },
  { id: 'M12', code: 'M12', title: 'Visits — Check-in, Check-out & OTP', mandatory: true,
    videos: [ { id: 'v12', title: 'Prove you were there — the honest way', dur: '08:00', added: '27 May 2026', mandatory: true } ],
    practice: {
      app: 'crm',
      src: 'Eurostar CRM.html?role=rep',
      label: 'Practice: visit check-in & OTP',
      intro: 'Practise a customer visit end to end. Dummy data — nothing is sent to the office.',
      tasks: [
        'Do your daily attendance check-in (photo selfie)',
        'Pick a dummy customer and tap Check in here',
        'Confirm the live timer and location started',
        'Tap Request check-out and enter the test OTP',
        'Confirm the visit closes with time & location recorded',
      ],
    } },
  { id: 'M13', code: 'M13', title: 'Logging Payments', mandatory: true,
    videos: [ { id: 'v13', title: 'Record every collection — cash & online', dur: '07:00', added: '27 May 2026', mandatory: true } ],
    practice: {
      app: 'crm',
      src: 'Eurostar CRM.html?role=rep',
      label: 'Practice: logging a payment',
      intro: 'Log both an online and a cash collection. Dummy data — nothing is sent to the office.',
      tasks: [
        'Log a ₹5,000 UPI payment against a dummy order',
        'Enter a reference number and attach any image',
        'Log a Cash payment with the carrier’s name & phone',
        'Confirm the payment reads “Pending verification”',
      ],
    } },
  { id: 'M14', code: 'M14', title: 'Prices, MOQ, Credit & Delivery', mandatory: true,
    videos: [ { id: 'v14', title: 'The commercial rules you must get right', dur: '08:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M15', code: 'M15', title: 'After the Order — Follow-up & Pipeline', mandatory: true,
    videos: [ { id: 'v15', title: 'The customer journey & keeping it warm', dur: '07:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M16', code: 'M16', title: 'Your Salary & Commission', mandatory: true,
    videos: [ { id: 'v16', title: 'How you earn — salary, slabs & targets', dur: '07:00', added: '07 Jul 2026', mandatory: true } ] },
  { id: 'M17', code: 'M17', title: 'Conduct & Confidentiality', mandatory: true,
    videos: [ { id: 'v17', title: 'Represent Eurostar — conduct & data safety', dur: '06:00', added: '27 May 2026', mandatory: true } ] },
  { id: 'M18', code: 'M18', title: 'Dress Code & Visiting Cards', mandatory: true,
    videos: [ { id: 'v18', title: 'Look the part — the Eurostar T-shirt & your card', dur: '05:00', added: '07 Jul 2026', mandatory: true } ] },
];

// Module notes — shown to trainees right below each module's video.
// Concise revision points sourced from the Sales Rep Module Notes handout.
const LMS_MODULE_NOTES = {
  M1: [
    'Eurostar has supplied the jewellery trade since 1980 — 40+ years; authorised distributor for the Asia-Pacific region.',
    'We sell to manufacturers & wholesalers, NOT the public — the people who set our stones into rings, pendants and bangles.',
    'Our three promises: consistent quality · consistent sizing · reliable supply.',
    'Two-sentence intro to memorise: "I\u2019m from Eurostar. We\u2019ve supplied calibrated stones to the trade since 1980 \u2014 moissanite, zirconia, pearls, natural stones \u2014 all in matched sizes, ready for casting."',
    'The one big idea behind everything: specials open the door → the relationship builds trust → White Round Zirconia is the goal.',
  ],
  M2: [
    'The four ways we sell: Piece (pc) · Carat (ct, by weight) · Packet (pkt) · Strip.',
    'Packet model: the pieces inside one packet change with size — small size = many pieces, big size = few.',
    'Carat is used for moissanite, lab-grown and beads; strip is used for Multi Sapphire.',
    'Our families at a glance: showpieces (moissanite, HD zirconia, alpanite, lab-grown), everyday workhorses (Colour CZ, pearls, MOP, corundums, cabochons, navratnas), and the volume core — White Round CZ.',
    'Quality words a jeweller uses: lustre/shine · cutting · calibrated · wax-castable · VVS/DEF (keep these in English).',
    'You won\u2019t know every price in week one — know the range and confirm the exact number on the app.',
  ],
  M3: [
    'White Round is your volume — but big business often comes from the OTHER products. Know them all and pitch what fits the customer.',
    'MOISSANITE: diamond alternative, extreme sparkle & hardness. Colour grades DEF (top, icy white) and GH (near-white, better value); clarity VVS. Laser-marked, GRA-certified. Sold by carat; larger stones by piece. For premium gold & diamond houses.',
    'HD (HIGH DENSITY) ZIRCONIA: ~25% heavier than normal CZ for the same size — gives gold jewellers more gross weight. Casts well, holds under heat. Pitch to GOLD customers selling by gross weight.',
    'ALPANITE: Eurostar\u2019s proprietary wax-castable coloured synthetics — full colour range, economical. Great for coloured-stone lines and imitation at a workable price.',
    'LAB-GROWN / CREATED gems: IGI-certifiable, natural-like inclusions, real gemstone properties at a fraction of natural cost. For premium buyers who want certificates.',
    'COLOUR CZ: calibrated cubic zirconia in 80+ heat-stable shades — the everyday workhorse across all metals.',
    'PEARLS & MOTHER OF PEARL: freshwater/created pearls (many colours; drilled / half-drilled / undrilled) and natural/synthetic MOP cut to spec.',
    'ALSO KNOW: Corundums, Cabochons, Navratnas, Opaques, Beads, Coral, Polki, Evil Eye, Bracelets — know each exists and who buys it; open the catalog on the app to show photos, sizes & price live.',
    'Golden habit: match the product to the customer\u2019s metal, budget and product line. Every category is a chance for a big order.',
  ],
  M4: [
    'White Round CZ is the centre of our business — your steady volume and commission. Know it cold.',
    'Ask the METAL first — it drives the whole grade choice.',
    'GOLD (gross wt): HD Zirconia → Elements H/HH/HEA → GQ. GOLD (net wt): Elements Thin/Normal, GQ, Euro AAA, Laser.',
    'SILVER: GQ → Euro AAA → Prizma → Eternal → Rajkot.',
    'BRASS (imitation): Rajkot Silver / Shampoo Packet only.',
    'Grades finest → cheapest: Eurostar Laser Engraved · Elements · GQ · Euro AAA · Prizma · Eternal · Rajkot.',
    'Pitch: fully castable, withstands 1000\u00b0C+, doesn\u2019t break in hand setting. Invite a small trial — never attack the competitor.',
  ],
  M5: [
    'Our customers are manufacturers & wholesalers — they buy to set & resell, not to wear.',
    'They judge on cost per piece, consistency across a bulk order, and casting behaviour — not retail display.',
    'Premium gold & diamond houses → Elements / Euro AAA, Moissanite, IGI lab-grown.',
    'Fine & mid gold / premium silver → GQ, Euro AAA, Prizma.',
    'Mass silver & imitation → Prizma, Eternal, Alpanite economy, Rajkot Zirconia.',
    'Golden listening rule: in the first meeting, ask and listen more than you talk. Learn what they make and who they sell to, and you already know what to recommend.',
  ],
  M6: [
    'Your job isn\u2019t only to sell — it\u2019s to build and cover a territory: a growing list of active, repeat customers.',
    'Find customers: jewellery manufacturing hubs & markets, wholesale clusters, referrals from happy customers, and office-provided leads.',
    'Referrals are gold — a satisfied customer\u2019s introduction beats any cold visit. Always ask, "Who else do you know who could use these?"',
    'Cover your area systematically — plan visit routes so no market pocket is neglected; revisit good customers regularly.',
    'Hit your monthly new-customer target (minimum 50 new adds/month) — add every new customer in the app the day you meet them.',
    'Know the competition & the market: what other suppliers offer and at what price, so you can position Eurostar\u2019s quality, sizing and reliability.',
    'Carry & show samples and the app catalog everywhere — you never know which visit becomes a big account.',
  ],
  M7: [
    'Don\u2019t lead with white round — a new customer already has a supplier and doesn\u2019t trust you yet. Earn the right to talk about it.',
    'The four-step strategy: 1) Open with something special · 2) Deliver a small order perfectly · 3) Bridge to white round with a trial · 4) If they ask for white round first, go straight there.',
    'Specials get attention; delivering builds trust; the trial converts to repeating white-round business.',
    'Use judgement — if you sense you can land white round in the first shot, go for it. The strategy is a guide, not a rule.',
  ],
  M8: [
    'Five stages: Open → Discover → Show → Bridge → Close.',
    'For office leads, call and fix an appointment first — don\u2019t just turn up.',
    'Discover by asking & listening: what they make, what they buy, where the pain is.',
    'Show the sample folder first (let them hold stones), then the app for photos, full range & price.',
    'Always close with a small, clear next step — a trial order plus a follow-up date. Never leave without one.',
    'Onboard them to the app there and then — getting it on their (or their manager\u2019s) phone is as important as the first order.',
  ],
  M9: [
    'Rule for every objection: Acknowledge → reassure → offer a small trial. Never argue, never run down a competitor.',
    '"I already have a supplier" → "That\u2019s good — a small trial just gives you a strong second option."',
    '"Your price is high" → "Let\u2019s compare the same grade — poor calibration costs more in setting time & rejections."',
    '"I\u2019ll think about it" → "Of course — let me send a trial so you decide on the stone in your hand."',
    '"I only buy white round" → the best objection you can hear! Quote their sizes right away.',
  ],
  M10: [
    'Ordering flow: Category → Grade → Colour → Shape → Size list (a progress bar shows the step).',
    'White Round skips Colour & Shape (jumps Grade → Sizes — it\u2019s only ever white & round).',
    'On the size pad read: Size · Pcs/packet · \u20b9/pc · Wt/1000pcs · set Packets with +/\u2212 — the line total updates live.',
    'Special flows: Ice Cut → pick the G-code; Beads → sub-type; Opaque → cut-shape grid; Lab Grown → optional IGI certificate add-on.',
    'Use Get Proforma → share on WhatsApp. RFQ Enquiry is for specials (\u20b910,000 minimum). "Sold out" sizes are temporarily offline — you cannot add them.',
    'Every price view shows the customer\u2019s unique code — never crop it out or share it.',
  ],
  M11: [
    'Sales App = ordering. CRM = managing your day. Open the CRM every morning.',
    'Four Quick Actions on My Desk: Take an order · Add customer · Log payment · Call manager.',
    'Five tabs: My Desk · Pipeline & follow-ups · My RFQs · My customers · My commission.',
    'Clear the red alert (overdue payments) and amber alert (new-customer target) first.',
    'Add every new customer the same day you meet them, with correct GST & contact details.',
  ],
  M12: [
    'Two check-ins: daily attendance (morning selfie — no check-in = marked absent) and visit check-in (records GPS + starts a timer).',
    'Check out: tap Request check-out → an OTP goes to the customer\u2019s own phone → ask for it, enter it → Confirm.',
    'The customer\u2019s phone is your proof — you can\u2019t close a visit you didn\u2019t actually make.',
    'Check out every visit by 11:59 PM or it is auto-marked "Check out failed" — that looks doubtful on your record.',
  ],
  M13: [
    'Payment doesn\u2019t go through the app — if you don\u2019t log it, the customer keeps getting reminders even after paying.',
    'Online (UPI/NEFT/Cheque): enter amount, date, UTR/reference number, attach a receipt.',
    'Cash: also record who is carrying it to Head Office (name & phone), the hand-over date, amount and a receipt image.',
    'After you submit: Pending verification → office confirms → Payment confirmed (reminders stop). If it doesn\u2019t match → Rejected, resubmit.',
    'Log every collection the same day.',
  ],
  M14: [
    'Minimum order \u20b91,000. Courier: flat \u20b9300 at \u20b91,000; FREE above \u20b91,000. RFQ minimum \u20b910,000.',
    'Every customer starts as a CASH customer (pay then ship).',
    'Credit terms (15/30/45/60 days) are given ONLY after the office approves them in the CRM — never promise credit yourself.',
    'Discounts are applied by the office/admin — route negotiations to the office, don\u2019t invent a price.',
    'MOQ: most goods sell by full packets; carat goods have a small minimum. The app enforces it.',
    'Never promise a price, discount or credit on your own authority — quote what the app shows.',
  ],
  M15: [
    'The first order is the start, not the finish — keep the pipeline honest and up to date.',
    'Pipeline stages: 1 First call · 2 Met & added · 3 Sample order · 4 Feedback · 5 Will order soon · \u2715 Not interested.',
    'After a trial is delivered, ALWAYS go back for feedback (Stage 4).',
    'That feedback visit is where a special-product trial becomes a repeating white-round order — don\u2019t skip it.',
    'Close dead leads honestly so the team isn\u2019t chasing them, and revisit good customers regularly to keep them warm.',
  ],
  // M16 (Salary & Commission) is generated from LMS_COMPENSATION below — do not hand-edit here.
  M17: [
    'Be punctual, polite and honest — you are the face of a 40-year-old name.',
    'Do your daily photo check-in every morning before the field (no check-in = absent) and hit your monthly new-customer target (min 50).',
    'Update the app/CRM truthfully — customers, orders, pipeline stages and geo-location.',
    'Price lists, customer data and product info are STRICTLY confidential. Every price view carries a unique code that traces who shared it.',
    'Sharing company data with outsiders or competitors will lead to serious consequences.',
    'You are never alone in the field — stuck, unsure on price, or facing a problem? Call your Area Sales Manager or Sales Head right away. Asking for help fast is professionalism.',
  ],
  M18: [
    'Eurostar provides your T-shirts — wear the Eurostar T-shirt on every field visit. It is your uniform and identifies you as our representative.',
    'Men: Eurostar T-shirt with clean, neutral trousers (no shorts) and closed, clean footwear. Hair neat, well-groomed.',
    'Women: Eurostar T-shirt with formal trousers or a decent skirt / salwar; modest, comfortable and professional. Footwear clean and closed.',
    'Emergency (T-shirt not available / at the wash): wear a plain, clean, well-ironed formal shirt in a sober colour with formal trousers — always look presentable. Never crumpled or flashy.',
    'General: clothes clean and ironed, personal hygiene maintained, minimal strong perfume, no slippers/flip-flops in the field.',
    'Visiting cards: we print and send you cards with your name on them — always carry them.',
    'Give your visiting card to every customer respectfully — hand it over with BOTH hands. It shows we value the relationship.',
    'Keep your cards clean and uncreased; never hand over a dirty or bent card.',
  ],
};

// Question bank — full assessment across all 14 training modules (MCQ / True-False).
//
// ---- LANGUAGE WIRING (translations slot in here later) ----
// Module notes are served through LMS_NOTES_I18N, keyed by language code.
// Today only English ('en') exists; the renderer falls back to English for any
// language not yet filled in. To add a language later, add e.g.:
//   LMS_NOTES_I18N.hi = { M1: [...], M2: [...], ... }
// Mira videos localise the same way via each video's optional `srcByLang`
// map (e.g. { en: 'M8-en.mp4', hi: 'M8-hi.mp4' }); lmsVideoSrc() picks the
// right file for the chosen language, falling back to English.
const LMS_NOTES_I18N = { en: LMS_MODULE_NOTES };

// ---- Compensation & commission (EDITABLE by the office) ----
// Change these figures anytime in Admin → Settings → Compensation, or edit here.
// All amounts are ₹. Slabs are cumulative bands on monthly sales.
const LMS_COMPENSATION = {
  currency: '₹',
  salaryLow: 15000,
  salaryHigh: 20000,
  targetMonth: 500000,        // min monthly sales target reps should reach by month 2
  targetByMonth: 2,
  avgLow: 2000000,
  avgHigh: 5000000,
  slabs: [
    { from: 0,       to: 500000,   pct: 2 },
    { from: 500001,  to: 1000000,  pct: 3 },
    { from: 1000001, to: null,     pct: 4 },   // null = "upwards"
  ],
};
// Indian-format a rupee amount (12,34,567).
function lmsINR(n) {
  const s = Math.round(Math.abs(n)).toString();
  if (s.length <= 3) return '₹' + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return '₹' + rest + ',' + last3;
}
// Build the M16 module notes from the editable config, so edits show everywhere.
function lmsBuildCommissionNotes() {
  const c = LMS_COMPENSATION;
  const slabLines = c.slabs.map(s => s.to == null
    ? `${lmsINR(s.from)} and above — commission @ ${s.pct}%`
    : `${lmsINR(s.from)} to ${lmsINR(s.to)} — commission @ ${s.pct}%`);
  return [
    `You earn a fixed salary (${lmsINR(c.salaryLow)}–${lmsINR(c.salaryHigh)} to start) PLUS commission on your monthly sales.`,
    'Commission is slab-based on your total monthly sales:',
    ...slabLines,
    `Higher slabs pay a higher rate — so the more you sell in a month, the better your rate on the top band.`,
    `Minimum target: reach at least ${lmsINR(c.targetMonth)} in monthly sales by month ${c.targetByMonth}. This is kept deliberately low to encourage you — treat it as the floor, not the goal.`,
    `A good rep typically does ${lmsINR(c.avgLow)}–${lmsINR(c.avgHigh)} a month. Aim there.`,
    'Commission is calculated by the office from confirmed, paid orders — log every payment so your sales count.',
  ];
}
LMS_MODULE_NOTES.M16 = lmsBuildCommissionNotes();

const LMS_LANGS = [
  { id: 'en', label: 'English',  native: 'English' },
  { id: 'hi', label: 'Hindi',    native: 'हिन्दी' },
  { id: 'mr', label: 'Marathi',  native: 'मराठी' },
  { id: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { id: 'ta', label: 'Tamil',    native: 'தமிழ்' },
  { id: 'bn', label: 'Bengali',  native: 'বাংলা' },
  { id: 'te', label: 'Telugu',   native: 'తెలుగు' },
];
function lmsNotesFor(modId, lang) {
  const set = LMS_NOTES_I18N[lang] || LMS_NOTES_I18N.en;
  return (set && set[modId]) || (LMS_NOTES_I18N.en && LMS_NOTES_I18N.en[modId]) || [];
}
function lmsVideoSrc(video, lang) {
  if (!video) return null;
  const m = video.srcByLang;
  if (m) return m[lang] || m.en || null;
  return video.src || null;
}
function lmsLangLabel(lang) {
  const l = LMS_LANGS.find(x => x.id === lang);
  return l ? l.native : 'English';
}

// Question bank — full assessment across all 18 training modules (MCQ / True-False).
// Sourced from the module notes. The test draws a randomised subset
// (LMS_TEST_CONFIG.count); raise that count to sample more of the bank per attempt.
// Moderate difficulty: scenario / application questions (not plain recall), each
// tied to its module's notes so the test genuinely checks the course. All
// auto-scored — MCQ (answer = correct option index) and True-False (answer =
// true/false). Distractors are plausible, so a candidate must actually
// understand the material, not just recognise a keyword.
const LMS_QUESTIONS = [
  // ---- M1 · Welcome to Eurostar ----
  { id: 'Q1',  mod: 'M1', type: 'MCQ',        q: 'A walk-in asks to buy a single stone for a ring they want to wear. What is the right response?', options: ['Sell them one piece at the packet rate', 'Explain Eurostar supplies the trade (manufacturers & wholesalers), not the public', 'Give them a retail price list', 'Refer them to our website checkout'], answer: 1 },
  { id: 'Q2',  mod: 'M1', type: 'MCQ',        q: 'A new rep tells a customer "our main promise is the lowest price in the market." What is wrong with that?', options: ['Nothing — price is our promise', 'Our three promises are consistent quality, consistent sizing and reliable supply — not lowest price', 'We only promise fast courier', 'We promise free credit'], answer: 1 },
  { id: 'Q3',  mod: 'M1', type: 'MCQ',        q: 'In Eurostar’s core strategy, what is the ultimate goal a rep works toward with each customer?', options: ['One big moissanite order', 'Selling as many specials as possible', 'Steady, repeating White Round Zirconia business', 'The highest single invoice'], answer: 2 },
  { id: 'Q4',  mod: 'M1', type: 'True-False', q: 'Eurostar has supplied the jewellery trade for over 40 years, since 1980.', answer: true },

  // ---- M2 · The Product Range — Overview ----
  { id: 'Q5',  mod: 'M2', type: 'MCQ',        q: 'A customer orders one packet of a small size and one packet of a large size of the same product. What is true about the piece counts?', options: ['Both packets hold the same number of pieces', 'The small size packet holds more pieces; the large size holds fewer', 'The large size packet holds more pieces', 'The customer decides the piece count'], answer: 1 },
  { id: 'Q6',  mod: 'M2', type: 'MCQ',        q: 'Which product is sold by the strip rather than by piece, carat or packet?', options: ['Moissanite', 'Multi Sapphire', 'White Round CZ', 'HD Zirconia'], answer: 1 },
  { id: 'Q7',  mod: 'M2', type: 'MCQ',        q: 'Which group of products is sold by carat (weight)?', options: ['Colour CZ, MOP, corundum', 'Moissanite, lab-grown and beads', 'White Round CZ and pearls', 'Alpanite and navratna'], answer: 1 },
  { id: 'Q8',  mod: 'M2', type: 'True-False', q: '"Calibrated" means every stone of a given size is identical, so it drops straight into the setting.', answer: true },
  { id: 'Q9',  mod: 'M2', type: 'True-False', q: 'A rep is expected to memorise every exact price in their first week rather than confirm it on the app.', answer: false },

  // ---- M3 · Product Knowledge — Deep Dive ----
  { id: 'Q10', mod: 'M3', type: 'MCQ',        q: 'A gold jeweller who sells by gross weight wants a whiter look without raising the cost per piece. Which product fits best, and why?', options: ['Moissanite — it sparkles the most', 'HD Zirconia — it is ~25% heavier, adding gross weight', 'Alpanite — it comes in colours', 'Pearls — they are inexpensive'], answer: 1 },
  { id: 'Q11', mod: 'M3', type: 'MCQ',        q: 'A customer wants the whitest, iciest moissanite you offer. Which colour grade do you quote?', options: ['GH (near-white, better value)', 'DEF (top, icy white)', 'VVS', 'IJ'], answer: 1 },
  { id: 'Q12', mod: 'M3', type: 'MCQ',        q: 'Which best describes Alpanite?', options: ['A natural certified gemstone', 'Eurostar’s proprietary wax-castable coloured synthetics', 'A premium moissanite grade', 'A freshwater pearl line'], answer: 1 },
  { id: 'Q13', mod: 'M3', type: 'MCQ',        q: 'A premium buyer insists on a certificate for every stone. Which line do you steer them to?', options: ['Rajkot zirconia', 'Colour CZ', 'Lab-grown / IGI-certifiable gems', 'Plain beads'], answer: 2 },
  { id: 'Q14', mod: 'M3', type: 'True-False', q: 'Because White Round is our volume seller, the other categories rarely lead to big orders.', answer: false },

  // ---- M4 · Hero Product — White Round CZ ----
  { id: 'Q15', mod: 'M4', type: 'MCQ',        q: 'Before you recommend a White Round grade, what must you establish first?', options: ['The customer’s budget', 'Which metal the customer works in', 'The customer’s city', 'The size of their shop'], answer: 1 },
  { id: 'Q16', mod: 'M4', type: 'MCQ',        q: 'A customer casts in GOLD and sells by gross weight. Which do you lead with?', options: ['Rajkot packet', 'HD Zirconia', 'Eternal', 'The cheapest grade'], answer: 1 },
  { id: 'Q17', mod: 'M4', type: 'MCQ',        q: 'A customer makes imitation jewellery in BRASS. Which grade(s) are appropriate?', options: ['Eurostar Laser Engraved', 'Elements H/HH', 'Rajkot Silver / Shampoo Packet only', 'Moissanite'], answer: 2 },
  { id: 'Q18', mod: 'M4', type: 'MCQ',        q: 'Which list orders White Round grades correctly from finest to cheapest?', options: ['Rajkot, Eternal, Prizma, Euro AAA, GQ, Elements, Laser', 'Laser Engraved, Elements, GQ, Euro AAA, Prizma, Eternal, Rajkot', 'GQ, Laser, Elements, Rajkot, Prizma, Eternal, Euro AAA', 'Elements, Rajkot, GQ, Laser, Euro AAA, Prizma, Eternal'], answer: 1 },
  { id: 'Q19', mod: 'M4', type: 'True-False', q: 'Our White Round is fully castable and withstands 1000°C+, so it does not break during hand setting.', answer: true },

  // ---- M5 · Knowing Your Customer ----
  { id: 'Q20', mod: 'M5', type: 'MCQ',        q: 'Our customers are manufacturers and wholesalers. What do they mainly judge stones on?', options: ['Retail display appeal', 'Cost per piece, consistency across a bulk order and casting behaviour', 'Advertising and packaging', 'Which celebrity endorses them'], answer: 1 },
  { id: 'Q21', mod: 'M5', type: 'MCQ',        q: 'You are meeting a premium gold & diamond house. Which product mix fits them best?', options: ['Rajkot shampoo packet and brass fittings', 'Elements / Euro AAA, Moissanite, IGI lab-grown', 'Eternal and Alpanite economy only', 'Plain beads and coral'], answer: 1 },
  { id: 'Q22', mod: 'M5', type: 'MCQ',        q: 'A mass-silver and imitation maker wants the lowest workable cost. What suits them?', options: ['Moissanite and IGI lab-grown', 'Prizma, Eternal, Alpanite economy, Rajkot zirconia', 'Elements and Euro AAA', 'Only white round GQ'], answer: 1 },
  { id: 'Q23', mod: 'M5', type: 'True-False', q: 'In a first meeting you should talk more than you listen, to show off your product knowledge.', answer: false },

  // ---- M6 · Marketing & Building Your Territory ----
  { id: 'Q24', mod: 'M6', type: 'MCQ',        q: 'Which is the strongest source of new customers?', options: ['Cold visits with no introduction', 'Referrals from happy customers', 'Random phone dialling', 'Waiting for walk-ins'], answer: 1 },
  { id: 'Q25', mod: 'M6', type: 'MCQ',        q: 'You meet a promising new customer in the market. When should you add them in the app?', options: ['At the end of the month', 'The same day you meet them', 'Only after their first order ships', 'Only if the office asks'], answer: 1 },
  { id: 'Q26', mod: 'M6', type: 'MCQ',        q: 'What is the minimum monthly new-customer target for a rep?', options: ['10', '25', '50', '100'], answer: 2 },
  { id: 'Q27', mod: 'M6', type: 'True-False', q: 'Knowing competitors’ offers and prices helps you position Eurostar’s quality, sizing and reliability.', answer: true },

  // ---- M7 · The Eurostar Selling Strategy ----
  { id: 'Q28', mod: 'M7', type: 'MCQ',        q: 'It is your first visit to a customer who already has a supplier. What should you open with?', options: ['A hard pitch on white round', 'Something special to get attention', 'A demand that they switch suppliers', 'A discount on their whole range'], answer: 1 },
  { id: 'Q29', mod: 'M7', type: 'MCQ',        q: 'Which is the correct order of the four-step selling strategy?', options: ['Open with a special → deliver a small order perfectly → bridge to white round with a trial → (go straight to white round if they ask)', 'Quote white round → give credit → discount → close', 'Cold call → email → wait → chase', 'Show catalog → argue price → push → leave'], answer: 0 },
  { id: 'Q30', mod: 'M7', type: 'True-False', q: 'If a customer asks for white round themselves on the first visit, you should still hold back and sell a special first.', answer: false },

  // ---- M8 · The Sales Conversation ----
  { id: 'Q31', mod: 'M8', type: 'MCQ',        q: 'What are the five stages of the sales conversation, in order?', options: ['Open → Discover → Show → Bridge → Close', 'Greet → Sell → Bill → Pack → Leave', 'Call → Meet → Quote → Wait → Chase', 'Ask → Argue → Agree → Order → Go'], answer: 0 },
  { id: 'Q32', mod: 'M8', type: 'MCQ',        q: 'You have been given a Head-Office lead. What is your first step?', options: ['Just turn up at their door', 'Call and fix an appointment before visiting', 'Send a WhatsApp price list and wait', 'Add them to the pipeline and forget it'], answer: 1 },
  { id: 'Q33', mod: 'M8', type: 'MCQ',        q: 'In the "Show" stage, what do you present first?', options: ['The app price list', 'The sample folder — let them hold the stones — then the app', 'A signed contract', 'A credit application'], answer: 1 },
  { id: 'Q34', mod: 'M8', type: 'True-False', q: 'You should never leave a meeting without agreeing a small, clear next step.', answer: true },

  // ---- M9 · Handling Objections ----
  { id: 'Q35', mod: 'M9', type: 'MCQ',        q: 'What is the correct way to handle any objection?', options: ['Argue and prove them wrong', 'Acknowledge → reassure → offer a small trial', 'Drop the price immediately', 'Walk away politely'], answer: 1 },
  { id: 'Q36', mod: 'M9', type: 'MCQ',        q: 'A customer says "your price is high." What is the best reply?', options: ['"Fine, I’ll give you a discount."', '"Let’s compare the same grade — poor calibration costs more in setting time and rejections."', '"Our competitor is cheating you."', '"Then you can’t afford quality."'], answer: 1 },
  { id: 'Q37', mod: 'M9', type: 'MCQ',        q: 'Which objection is actually the BEST one to hear?', options: ['"Your price is high"', '"I’ll think about it"', '"I only buy white round"', '"I already have a supplier"'], answer: 2 },
  { id: 'Q38', mod: 'M9', type: 'True-False', q: 'Running down a competitor is an acceptable way to win an order.', answer: false },

  // ---- M10 · The Sales App — Ordering ----
  { id: 'Q39', mod: 'M10', type: 'MCQ',       q: 'What is the ordering flow on the Sales App?', options: ['Category → Grade → Colour → Shape → Size', 'Login → Pay → Ship', 'Search → Pay → Done', 'Cart → Grade → Pay'], answer: 0 },
  { id: 'Q40', mod: 'M10', type: 'MCQ',       q: 'Why does ordering White Round skip the Colour and Shape steps?', options: ['Those steps are broken', 'It is only ever white and round, so it jumps Grade → Sizes', 'The customer picks them later', 'To save data'], answer: 1 },
  { id: 'Q41', mod: 'M10', type: 'MCQ',       q: 'A size shows greyed-out with a "Sold out" tag. What does it mean, and can you add it?', options: ['It is on discount — add it', 'It is temporarily offline — you cannot add it', 'It is the cheapest — add it', 'It just needs an RFQ fee'], answer: 1 },
  { id: 'Q42', mod: 'M10', type: 'True-False', q: 'It is fine to crop out the customer’s unique code before sharing a price screenshot.', answer: false },
  { id: 'Q43', mod: 'M10', type: 'True-False', q: 'The RFQ Enquiry (for specials) has a ₹10,000 minimum order value.', answer: true },

  // ---- M11 · The Rep CRM — Your Day ----
  { id: 'Q44', mod: 'M11', type: 'MCQ',       q: 'Which are the four Quick Actions on the CRM My Desk?', options: ['Take an order, Add customer, Log payment, Call manager', 'Chat, Email, Print, Scan', 'Search, Filter, Sort, Export', 'Login, Logout, Refresh, Help'], answer: 0 },
  { id: 'Q45', mod: 'M11', type: 'MCQ',       q: 'You open the CRM and see a red alert and an amber alert. Which do you handle first, and what is the red one?', options: ['The amber alert — new-customer target', 'The red alert — overdue payments', 'Either, they are the same', 'Neither, they clear on their own'], answer: 1 },
  { id: 'Q46', mod: 'M11', type: 'True-False', q: 'The Sales App is for ordering; the CRM is for managing your day.', answer: true },

  // ---- M12 · Visits — Check-in, Check-out & OTP ----
  { id: 'Q47', mod: 'M12', type: 'MCQ',       q: 'At visit check-out, whose phone receives the OTP?', options: ['The rep’s phone', 'The customer’s own phone', 'The Sales Head’s phone', 'Head Office'], answer: 1 },
  { id: 'Q48', mod: 'M12', type: 'MCQ',       q: 'You forget to check out of a visit by 11:59 PM. What happens?', options: ['Nothing', 'It is auto-marked "Check out failed"', 'You earn a bonus', 'The order is cancelled'], answer: 1 },
  { id: 'Q49', mod: 'M12', type: 'True-False', q: 'Skipping your morning attendance selfie means you are marked absent.', answer: true },

  // ---- M13 · Logging Payments ----
  { id: 'Q50', mod: 'M13', type: 'MCQ',       q: 'A customer paid last week but still keeps getting reminders. What most likely went wrong?', options: ['The office lost the money', 'The collection was never logged in the CRM', 'The customer paid twice', 'The app is down'], answer: 1 },
  { id: 'Q51', mod: 'M13', type: 'MCQ',       q: 'When logging a CASH payment, besides amount and date, what extra detail must you record?', options: ['The customer’s birthday', 'Who is carrying the cash to Head Office (name & phone)', 'The weather that day', 'A discount code'], answer: 1 },
  { id: 'Q52', mod: 'M13', type: 'True-False', q: 'A logged payment reads "Pending verification" until the office confirms it.', answer: true },

  // ---- M14 · Prices, MOQ, Credit & Delivery ----
  { id: 'Q53', mod: 'M14', type: 'MCQ',       q: 'What is the minimum order value and the courier rule?', options: ['₹500 min; courier always free', '₹1,000 min; flat ₹300 courier at ₹1,000, free above ₹1,000', '₹5,000 min; customer arranges courier', '₹10,000 min; courier always ₹300'], answer: 1 },
  { id: 'Q54', mod: 'M14', type: 'MCQ',       q: 'A customer asks you for 30-day credit on the spot. What do you do?', options: ['Grant it — you have the authority', 'Route it to the office — only they approve credit in the CRM; never promise it yourself', 'Refuse credit to everyone', 'Give credit but charge extra'], answer: 1 },
  { id: 'Q55', mod: 'M14', type: 'True-False', q: 'Every new customer starts as a cash customer (pay, then ship).', answer: true },
  { id: 'Q56', mod: 'M14', type: 'True-False', q: 'A rep may offer a discount on their own authority to close a deal.', answer: false },

  // ---- M15 · After the Order — Follow-up & Pipeline ----
  { id: 'Q57', mod: 'M15', type: 'MCQ',       q: 'You have delivered a trial order. What is the most important next step, and why?', options: ['Close the lead — the job is done', 'Wait for the customer to call you', 'Go back for feedback (Stage 4) — that is where a special trial becomes repeating white-round business', 'Offer a bigger discount'], answer: 2 },
  { id: 'Q58', mod: 'M15', type: 'MCQ',       q: 'Which is the correct early pipeline order?', options: ['First call → Met & added → Sample order → Feedback', 'Feedback → First call → Sample → Met', 'Sample → First call → Feedback → Met', 'Met → Feedback → First call → Sample'], answer: 0 },
  { id: 'Q59', mod: 'M15', type: 'True-False', q: 'A lead that clearly will not buy should be left open so the team keeps chasing it.', answer: false },

  // ---- M16 · Salary & Commission ----
  { id: 'Q60', mod: 'M16', type: 'MCQ',        q: 'How is a rep paid?', options: ['Commission only', 'A fixed salary PLUS slab-based commission on monthly sales', 'Fixed salary only', 'A flat fee per visit'], answer: 1 },
  { id: 'Q61', mod: 'M16', type: 'MCQ',        q: 'One rep sells ₹4 lakh in a month, another sells ₹12 lakh. What is true about their commission rate?', options: ['Both earn the same flat rate', 'The higher seller earns a higher rate on the top band — slabs rise with sales', 'The lower seller earns more per rupee', 'Commission is only paid above ₹50 lakh'], answer: 1 },
  { id: 'Q62', mod: 'M16', type: 'True-False', q: 'Only confirmed, paid orders count toward your commission — so you must log every payment.', answer: true },

  // ---- M17 · Conduct & Confidentiality ----
  { id: 'Q63', mod: 'M17', type: 'MCQ',       q: 'You are stuck at a customer and unsure on a price. What is the professional move?', options: ['Guess a price to look confident', 'Call your Area Sales Manager or Sales Head right away', 'Leave and come back another day', 'Promise whatever it takes to close'], answer: 1 },
  { id: 'Q64', mod: 'M17', type: 'True-False', q: 'Price lists and customer data are strictly confidential and must not be shared with outsiders or competitors.', answer: true },
  { id: 'Q65', mod: 'M17', type: 'True-False', q: 'The unique code on each price view is only decorative and traces nothing.', answer: false },

  // ---- M18 · Dress Code & Visiting Cards ----
  { id: 'Q66', mod: 'M18', type: 'MCQ',        q: 'What must a rep wear on every field visit?', options: ['Any formal shirt', 'The Eurostar T-shirt provided to them', 'A suit and tie', 'Whatever is comfortable'], answer: 1 },
  { id: 'Q67', mod: 'M18', type: 'MCQ',        q: 'How should you hand your visiting card to a customer?', options: ['Toss it on the table', 'With both hands, respectfully', 'With the left hand', 'Only if they ask for it'], answer: 1 },
  { id: 'Q68', mod: 'M18', type: 'True-False', q: 'If your Eurostar T-shirt is unavailable, a plain, clean, well-ironed formal shirt in a sober colour is an acceptable fallback.', answer: true },
];

// Time slots for the screening scheduler
const LMS_SLOTS = ['10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'];
const LMS_SLOTS_BOOKED = ['11:30 AM','2:30 PM'];

// Candidate-side journey steps (the 5 dashboard tiles)
const LMS_JOURNEY = [
  { id: 'apply',    label: 'Apply Now',  icon: '📋', hue: 220, desc: 'Submit your application' },
  { id: 'status',   label: 'My Status',  icon: '🎯', hue: 32,  desc: 'Track your progress' },
  { id: 'training', label: 'Training',   icon: '📗', hue: 142, desc: 'Watch training videos' },
  { id: 'test',     label: 'Take Test',  icon: '📝', hue: 270, desc: 'Clear the assessment' },
  { id: 'result',   label: 'My Result',  icon: '📊', hue: 8,   desc: 'See your score' },
];

const LMS_STATES = ['Maharashtra','Kerala','Karnataka','Jharkhand','Gujarat','Tamil Nadu','Telangana','Rajasthan','Delhi','West Bengal','Uttar Pradesh','Madhya Pradesh'];
const LMS_EXP = ['0–1 yr','1–3 yrs','3–5 yrs','5+ yrs'];

// ----- Test configuration (editable in Settings; drives the actual assessment) -----
const LMS_TEST_CONFIG = { count: 20, passPct: 70, durationMin: 20, randomize: true };

// ----- Onboarding document checklist (collected after hire) -----
const LMS_ONBOARD_DOCS = [
  { id: 'pan',     label: 'PAN Card' },
  { id: 'aadhaar', label: 'Aadhaar Card' },
  { id: 'bank',    label: 'Cancelled Cheque / Bank Proof' },
  { id: 'photo',   label: 'Passport Photo' },
  { id: 'address', label: 'Address Proof' },
];

// ----- System settings (editable; hardcoded values surfaced for the admin) -----
const LMS_SETTINGS = {
  passPct: 70, windowDays: 10, trainDays: 7, testDays: 2,
  zoomConnected: false,
  staffWhatsApp: '7710065480',
  newCustomerTarget: 50,
  templates: {
    testUnlocked: 'Hi {name}, your Eurostar assessment is now unlocked. Please complete it within {testDays} days.',
    hired: 'Congratulations {name}! You are hired as an Eurostar Sales Rep. Your Rep ID is {repId} and temporary password is {pwd}.',
    rejected: 'Hi {name}, thank you for your interest. We will not be moving forward at this time.',
  },
};

// ----- Notifications log (newest first) -----
const LMS_NOTIFICATIONS = [
  { id: 'N1', type: 'application', icon: '📥', who: 'Anuj Gupta', text: 'New application received — Mumbai, Maharashtra', time: '11 Jun · 04:11 PM', read: false },
  { id: 'N2', type: 'passed',      icon: '✅', who: 'Test 4',     text: 'Cleared the assessment with 100% — awaiting approval', time: '18 Jun · 02:40 PM', read: false },
  { id: 'N3', type: 'hired',       icon: '🎉', who: 'Test 1',     text: 'Hired · Rep ID ES-REP-JH-0001 issued — WhatsApp sent to staff', time: '05 Jun · 06:10 PM', read: true },
];

// ----- Audit log of admin actions (newest first) -----
const LMS_AUDIT = [
  { id: 'A1', actor: 'Admin (Office)', action: 'Unlocked training', target: 'test 3', time: '19 Jun · 10:02 AM' },
  { id: 'A2', actor: 'Admin (Office)', action: 'Hired & issued Rep ID ES-REP-JH-0001', target: 'Test 1', time: '05 Jun · 06:10 PM' },
  { id: 'A3', actor: 'Admin (Office)', action: 'Granted re-test', target: 'Test 1', time: '04 Jun · 05:30 PM' },
];

/**
 * When a booked screening slot stops being joinable, as an ISO timestamp.
 *
 * `date` is "YYYY-MM-DD" and `slot` is a label from LMS_SLOTS ("10:00 AM",
 * "2:30 PM"). Returns '' if either is missing or unparseable, which callers
 * treat as "never expires" rather than "already expired" — a link that dies
 * because of a formatting quirk would be worse than one that lingers.
 */
function lmsSlotEnd(date, slot, graceMin) {
  if (!date || !slot) return '';
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(slot).trim());
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const pm = /pm/i.test(m[3]);
  if (h === 12) h = 0;            // 12:xx AM is 00:xx; 12:xx PM is 12:xx
  if (pm) h += 12;
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d)) return '';
  d.setHours(h, min, 0, 0);
  // The slot is bookable for its length, so the link stays live that long.
  d.setMinutes(d.getMinutes() + (graceMin == null ? LMS_SLOT_MINUTES : graceMin));
  return d.toISOString();
}

Object.assign(window, {
  lmsSlotEnd, LMS_SLOT_MINUTES,
  LMS_STAGES, LMS_SOURCES, LMS_CANDIDATES, LMS_MODULES, LMS_MODULE_NOTES, LMS_NOTES_I18N, LMS_LANGS, lmsNotesFor, lmsVideoSrc, lmsLangLabel, LMS_COMPENSATION, lmsBuildCommissionNotes, lmsINR, LMS_QUESTIONS,
  LMS_SLOTS, LMS_SLOTS_BOOKED, LMS_JOURNEY, LMS_STATES, LMS_EXP,
  LMS_TODAY, LMS_PASS_PCT, LMS_WINDOW_DAYS, LMS_TRAIN_DAYS, LMS_TEST_DAYS, LMS_STATE_CODE,
  LMS_TEST_CONFIG, LMS_ONBOARD_DOCS, LMS_SETTINGS, LMS_NOTIFICATIONS, LMS_AUDIT,
  lmsWindow, lmsTestWindow, lmsNextRepId, lmsGenPassword, lmsDaysBetween, lmsBaseStage, lmsEffectiveStage, lmsHasProgressed,
  lmsTookTest, lmsAwaitingApproval,
});
