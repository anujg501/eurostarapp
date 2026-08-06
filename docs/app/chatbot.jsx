// chatbot.jsx — "Mira", the AI-driven in-app assistant for Eurostar wholesale customers.
// Powers: take orders, reorder past orders, live stock/substitutes, show customer price,
// proforma, dues & order status, payment help, escalate to rep, RFQ, complaints,
// multilingual, voice input, photo input. Calls the built-in AI via window.claude.complete.

function ChatAssistant({ persona, cart, addToCart, navigate, isOnline, route }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [listening, setListening] = React.useState(false);
  const [pendingImg, setPendingImg] = React.useState(null);
  const fileRef = React.useRef(null);
  const recRef = React.useRef(null);
  // Stable per-chat-session id so the whole conversation logs as one thread (for Mira Admin → Chats).
  const sessionRef = React.useRef('S-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7));
  const [msgs, setMsgs] = React.useState(() => ([
    { role: 'assistant', text: `Namaste${persona && persona.contact ? ' ' + persona.contact.split(' ')[0] : ''} 🙏 I'm Mira, your Eurostar assistant. I can take an order, repeat a past order, check stock or your dues, track a shipment, raise a custom request, or sort out any issue — in your language. How can I help?` }
  ]));
  const scroller = React.useRef(null);
  React.useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, open, busy]);

  // ---- Shipment updates pushed from the CRM: Mira proactively tells the customer when an order is dispatched ----
  const [unread, setUnread] = React.useState(0);
  // Office can switch the customer-facing Mira off from Mira Admin → Turn Mira
  // on/off. Pulled from the back room so the toggle reaches every customer, not
  // just the device that set it. Polled so a change applies without a reload.
  const [miraOn, setMiraOn] = React.useState(true);
  React.useEffect(() => {
    const API = window.EUROSTAR_API || location.origin;
    let alive = true;
    const pull = () => fetch(API + '/admin/mira/enabled')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && typeof d === 'object') setMiraOn(d.salesApp !== false); })
      .catch(() => {});
    pull();
    const iv = setInterval(pull, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  // Pull the image library from the back room so Mira can send the pictures the
  // office uploaded — on any customer device, not just the one that uploaded
  // them. imageLib() reads this localStorage key.
  React.useEffect(() => {
    const API = window.EUROSTAR_API || location.origin;
    fetch(API + '/admin/mira/images')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d)) { try { localStorage.setItem('eurostar-mira-images', JSON.stringify(d)); } catch (e) {} } })
      .catch(() => {});
  }, []);
  const readNotifs = () => { try { return JSON.parse(localStorage.getItem('eurostar-mira-notifications') || '[]'); } catch (e) { return []; } };
  // Production filters by the logged-in customer id; in this prototype we surface unread shipment updates.
  const pendingNotifs = () => readNotifs().filter(n => !n.read);
  React.useEffect(() => {
    const tick = () => setUnread(pendingNotifs().length);
    tick();
    const iv = setInterval(tick, 3000);
    window.addEventListener('storage', tick);
    return () => { clearInterval(iv); window.removeEventListener('storage', tick); };
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const pend = pendingNotifs();
    if (!pend.length) return;
    const bubbles = pend.map(n => ({ role: 'assistant', text: `📦 Good news! Your order ${n.orderId} has been dispatched${n.courier ? ' via ' + n.courier : ''}.${n.track ? '\nTracking number: ' + n.track : ''}\nYou'll receive it soon — reply here if you need anything. 🙏` }));
    setMsgs(m => [...m, ...bubbles]);
    try {
      const all = readNotifs().map(n => n.read ? n : { ...n, read: true });
      localStorage.setItem('eurostar-mira-notifications', JSON.stringify(all));
    } catch (e) {}
    setUnread(0);
  }, [open]);

  // ---- live context Mira can reason over ----
  const cats = (window.CATEGORIES || []).map(c => `${c.short} (${c.id})`).join(', ');
  // Mira must not read the demo ORDERS book — that is the sample personas' data,
  // so she would discuss a stranger's orders with whoever is signed in. Only the
  // orders this browser actually placed are safe context here; the assistant is
  // not authenticated, so it cannot fetch the customer's real history.
  const orders = (window.loadMyOrders ? loadMyOrders(persona) : []) || [];
  const findP = (pid) => (window.findProduct ? window.findProduct(pid) : null);
  const findT = (t) => (window.findTone ? window.findTone(t) : null);
  const histText = orders.slice(0, 5).map(o => `${o.id} [${o.date}, ${o.status}]: ` + o.lines.map(l => { const p = findP(l.pid); return (p ? p.name : l.pid) + ' ×' + l.qty; }).join(', ')).join(' | ') || 'no past orders on file';
  const soldKeys = window.loadSoldOut ? Object.keys(window.loadSoldOut()) : [];
  const soldText = soldKeys.length ? soldKeys.slice(0, 14).map(k => { const p = k.split('|'); return p[0] + ' ' + p.slice(-2).join(' '); }).join('; ') : 'nothing is sold out right now';
  const isCredit = ['15', '30', '45', '60'].includes(String(persona.terms));

  // ---- Full catalog briefing: every category with its grades, colours, shapes, sizes, unit & MOQ ----
  const catalogFacts = () => {
    try {
      const CATS = window.CATEGORIES || [];
      const GBY = window.GRADES_BY_CATEGORY || {};
      const CBY = window.COLORS_BY_CATEGORY || {};
      const SBY = window.SHAPES_BY_CATEGORY || {};
      const nm = (x) => (x && (x.name || x.label || x.short || x.id)) || x;
      const uLong = window.unitLabelLong || ((c) => (window.catUnit ? window.catUnit(c) : 'pc'));
      const moqOf = window.unitMoq ? (c) => window.unitMoq(c) : () => 1;
      const lines = CATS.map((c) => {
        const id = c.id;
        const grades = (GBY[id] || []).map((g) => g.name + (g.tier ? ' [' + g.tier + ']' : '')).filter(Boolean);
        const colours = (CBY[id] || []).map(nm).filter(Boolean);
        const shapes = (SBY[id] || []).map(nm).filter(Boolean);
        let unit = 'pc';
        try { unit = window.catUnit ? window.catUnit(id) : 'pc'; } catch (e) {}
        let moq = 1;
        try { moq = moqOf(id); } catch (e) {}
        const parts = [];
        if (grades.length) parts.push('Grades: ' + grades.join('; '));
        if (colours.length) parts.push('Colours: ' + colours.slice(0, 40).join(', '));
        if (shapes.length) parts.push('Shapes: ' + shapes.join(', '));
        parts.push('Sold by: ' + unit + (moq > 1 ? ' (min ' + moq + ')' : ''));
        return '• ' + (c.short || c.name) + ' (' + id + ') — ' + (c.blurb ? c.blurb + ' ' : '') + parts.join(' | ');
      });
      const sizeList = (window.FULL_SIZES || []).map((s) => (s.r != null ? s.r : s)).join(', ');
      return 'FULL CATALOG (this is the complete, authoritative product list — do NOT invent anything beyond it):\n' + lines.join('\n') + (sizeList ? '\n\nTypical round sizes available (mm): ' + sizeList : '');
    } catch (e) { return ''; }
  };

  // Image library (uploaded by the office in Mira Admin → Images). Each: {id,name,desc,data}.
  const imageLib = () => { try { return JSON.parse(localStorage.getItem('eurostar-mira-images') || '[]'); } catch (e) { return []; } };
  const imageLibFacts = () => {
    const lib = imageLib();
    if (!lib.length) return '';
    return '\n\nIMAGE LIBRARY — these are the ONLY images you can send. To send one, append <<IMG>>exact name<<END>> at the very end of your message. Send an image ONLY when the customer clearly asks for that specific item AND its exact name is in the list below. If the customer asks for an image that is NOT in this list, tell them you don\'t have that image yet — NEVER send a different image as a substitute, and never invent one:\n- ' + lib.map(im => im.name + (im.desc ? ' (' + im.desc + ')' : '')).join('\n- ');
  };

  // Admin-defined overrides (edited in the Mira Admin page, stored in localStorage).
  const miraOverrides = () => {
    let s = '';
    try {
      const inst = localStorage.getItem('eurostar-mira-instructions');
      if (inst && inst.trim()) s += '\n\nADMIN INSTRUCTIONS (highest priority, set by Eurostar office):\n' + inst.trim();
      const rules = JSON.parse(localStorage.getItem('eurostar-mira-rules') || '[]');
      if (rules.length) s += '\n\nCORRECTION RULES (always follow):\n- ' + rules.join('\n- ');
      const know = JSON.parse(localStorage.getItem('eurostar-mira-knowledge') || '[]');
      if (know.length) s += '\n\nKNOWLEDGE BASE:\n' + know.map(k => '• ' + k.title + ': ' + k.text).join('\n');
      const ex = JSON.parse(localStorage.getItem('eurostar-mira-examples') || '[]');
      if (ex.length) s += '\n\nEXAMPLE ANSWERS (match this phrasing/approach):\n' + ex.map(e => 'Q: ' + e.q + '\nA: ' + e.a).join('\n');
    } catch (e) {}
    return s;
  };

  const systemPrompt = () => `You are "Mira", the warm, concise WhatsApp-style assistant for Eurostar Technologies — a B2B wholesale supplier of cubic zirconia, moissanite and coloured gemstones to jewellers across Asia-Pacific. You serve trade customers (jewellers / manufacturers).

CUSTOMER: ${persona.company} · account ${persona.code} · ${persona.location || ''} · terms: ${isCredit ? persona.terms + ' days credit' : 'cash'}.
THEIR RECENT ORDERS: ${histText}.
CURRENTLY SOLD OUT: ${soldText}.
PRODUCT CATEGORIES (use the id in actions): ${cats}.

${catalogFacts()}

ORDERING: category → (grade) → colour → shape → size(s) in mm → quantity. White Round CZ is only white & round (just ask sizes). Quote realistic wholesale INR per piece (white round CZ ~₹2-5, moissanite much higher, coloured stones vary). Minimum order ₹1,000; courier free above ₹1,000. If a requested size is in the sold-out list, say so and offer the nearest available size or an RFQ.

LANGUAGE: detect the customer's language (English, Hindi, Gujarati, Tamil, Telugu, Kannada, Hinglish) and reply in the SAME language/script.

YOU CAN ALSO: recommend substitutes & sensible upsells; explain certificates (GRA/IGI), MOQ, shipping, returns; help with payments; raise custom requests; log complaints. Be proactive — if their history suggests a routine restock, gently offer to reorder.

THE EUROSTAR WAY (sell exactly how Eurostar trains its reps — from the official Eurostar Sales Training Script):
- Eurostar is trusted since 1980; manufacturers care about consistent quality, calibration, and reliable supply. Carry that reputation.
- Relationship first, white round next: a new customer rarely switches white round on day one. OPEN with something special (Moissanite, HD Zirconia, Alpanite colours, fancy bracelets), build trust with a perfect small order, THEN bridge to White Round CZ — that's where the volume and repeat business live. If the customer asks for white round themselves, that's the dream — go straight there and serve it brilliantly.
- Be consultative: before recommending, DISCOVER three things — what jewellery they make (gold / silver / imitation), which stones they buy in bulk, and where they feel pain (price, quality, or supply). Let their answers pick the product.
- WHITE-ROUND GRADE DECISION TREE (use the customer's metal to choose):
  · Ask FIRST: "What metal do you work in — gold, silver, or brass (imitation)?"
  · GOLD (weight matters — gold is ₹15,000+/g): ask if they sell by GROSS weight (stone weight included) or NET weight (stone weight deducted). GROSS → lead with weight: HD Zirconia (~25% extra weight) → if over budget, Elements H/HH/HEA → then GQ H/HH/HHH. Tip: ask their target weight at a size (e.g. "what weight do you want at 1.50 mm?") and guide them to the grade that hits it. NET → look & clarity lead: Elements Thin/Normal, GQ, Euro AAA → Laser Engraved for premium.
  · SILVER (~₹250/g, weight not a priority — quality & price lead): start at GQ → Euro AAA → Prizma → Eternal → Rajkot Silver/Shampoo packets for lowest budget.
  · BRASS / imitation: Rajkot mass-produced packets only (Silver Packet / Shampoo Packet).
  · A customer can always take MULTIPLE options — encourage a small trial of a couple of sizes/grades.
- The white-round pitch: "Whatever you pay for your white round today, let me show you the same grade from Eurostar — fully castable, withstands 1000°C+, holds calibration, won't break in setting. Try a small trial." NEVER attack a competitor — acknowledge → reassure → invite a small trial. The trial does the selling.
- Objection replies (acknowledge → reassure → offer a small trial): "I have a supplier" → "Good, sir — keep a strong second option, just try a small trial." "Your price is high" → "Compare the same grade; poor calibration costs more in setting time & rejections — try the trial and see the real cost." "I'll think about it" → "Shall I send a trial of one or two sizes so you decide with the stone in hand?" "I only buy white round" → "Perfect — that's our strength, let me quote your sizes now."
- Commercial rules you MUST respect: minimum order ₹1,000 (flat ₹300 courier at ₹1,000, free above). Everyone starts as CASH (pay then ship). Credit terms (15/30/45/60 days) and discounts are approved ONLY by the office — NEVER promise a price, discount, or credit on your own; route negotiations to the office/rep. Custom items go via RFQ (₹10,000 min). Quote what the app shows.

ACCURACY — DO NOT HALLUCINATE (critical):
- Never invent product specifications. Do NOT make up colours, shapes, sizes, grades, sub-types, certificates, or numbers you were not given. If you don't know a specific detail, say "let me confirm the exact options for you" and offer to open that category in the app or connect the rep — do not guess.
- HD Zirconia facts (state ONLY these): it has a SINGLE grade and is available in WHITE only. Its benefit is ~25% extra weight for the same size (good for "gross weight" billing), same sparkle/calibration as regular CZ, fully castable, withstands 1000°C+. It does NOT come in fancy colours or special grades — never claim otherwise.
- For other categories, speak in general terms ("we carry a wide range of sizes and shades") rather than inventing exact lists. Keep enthusiasm in check — be warm but factually careful. When unsure, defer to the app or the rep.

SILENT ACTION COMMANDS — append at the VERY END of your message, nothing after. Use only when appropriate:
- Add items to cart (only AFTER the customer confirms): <<CART>>[{"name":"White Round CZ · 2.00 mm","category":"whitecz","shape":"round","size":"2.00 mm","color":"White","quality":"AAA","qty":500,"pricePerPc":3.2}]<<END>>
- Repeat a past order (after they confirm): <<REORDER>>last<<END>> or <<REORDER>>EUR-2406-0210<<END>>
- Open a screen: <<GO>>orders<<END>> (cart), <<GO>>rfq<<END>> (custom quote), <<GO>>franchise<<END>>
- Offer to connect their Eurostar rep / escalate an issue: <<ESCALATE>>short reason<<END>>
- Send an image from the library to the customer: <<IMG>>exact image name<<END>> (you may send more than one)
Keep replies short (2-5 sentences), friendly and practical. Never mention or explain these markers to the customer.${imageLibFacts()}${miraOverrides()}`;

  const parseActions = (text) => {
    let clean = text, cartItems = null, go = null, reorder = null, escalate = null, images = [];
    const grab = (re) => { const m = clean.match(re); if (m) { clean = clean.replace(m[0], '').trim(); return m[1].trim(); } return null; };
    // Images (may be several). A name from the office's media library resolves
    // to the stored picture; anything else is treated as a catalogue key
    // ("laser|white|round") and fetched from the back room, which serves every
    // photo the office has uploaded from any screen.
    const API = window.EUROSTAR_API || location.origin;
    const mediaUrl = (key) => API + '/assistant/media?key=' + encodeURIComponent(key.trim());
    const lib = imageLib();
    let im;
    const imgRe = /<<IMG>>([\s\S]*?)<<END>>/;
    while ((im = clean.match(imgRe))) {
      const raw = im[1].trim();
      const nm = raw.toLowerCase();
      const hit = lib.find(x => (x.name || '').trim().toLowerCase() === nm) || lib.find(x => (x.name || '').trim().toLowerCase().includes(nm) || nm.includes((x.name || '').trim().toLowerCase()));
      if (hit) images.push(hit);
      else if (raw) images.push({ name: raw, desc: '', data: mediaUrl(raw) });
      clean = clean.replace(im[0], '').trim();
    }
    // A bare media link in the text is a picture the customer should SEE, not a
    // URL to copy out. Turn it into the image itself and take it out of the
    // sentence.
    const linkRe = /(?:https?:\/\/[^\s)]+)?\/assistant\/media\?key=([^\s)]+)/i;
    let lk;
    while ((lk = clean.match(linkRe))) {
      let key = lk[1];
      try { key = decodeURIComponent(key); } catch (e) {}
      images.push({ name: key, desc: '', data: mediaUrl(key) });
      clean = clean.replace(lk[0], '').replace(/\s{2,}/g, ' ').trim();
    }
    const cm = clean.match(/<<CART>>([\s\S]*?)<<END>>/);
    if (cm) { try { cartItems = JSON.parse(cm[1].trim()); } catch (e) {} clean = clean.replace(cm[0], '').trim(); }
    reorder = grab(/<<REORDER>>([\s\S]*?)<<END>>/);
    go = grab(/<<GO>>([\s\S]*?)<<END>>/);
    escalate = grab(/<<ESCALATE>>([\s\S]*?)<<END>>/);
    return { clean, cartItems, go, reorder, escalate, images };
  };

  const applyCart = (items) => {
    let n = 0;
    (items || []).forEach((it) => {
      const qty = Math.max(1, parseInt(it.qty, 10) || 0);
      const price = parseFloat(it.pricePerPc) || 0;
      const short = (window.CATEGORIES || []).find(c => c.id === it.category);
      addToCart({
        pid: 'AI-' + (it.category || 'gen') + '-' + String(it.size || '').replace(/\W/g, '') + '-' + Math.floor(Math.random() * 999),
        name: it.name || ((it.color ? it.color + ' ' : '') + (short ? short.short : 'Stone')),
        shape: it.shape || 'round', size: it.size || '', quality: it.quality || '', color: it.color || '', toneHex: '#9a8',
        unitMode: 'pc', ct: qty, qty, perCtPrice: price, unitPrice: price, lineTotal: price * qty,
      });
      n++;
    });
    return n;
  };

  const applyReorder = (which) => {
    let order = (which && which !== 'last') ? orders.find(o => o.id === which || o.id.includes(which)) : orders[0];
    if (!order) return { n: 0 };
    let n = 0;
    order.lines.forEach((l) => {
      const p = findP(l.pid); if (!p) return; const tone = findT(p.tone);
      addToCart({ pid: p.id, name: p.name, shape: p.shape, size: p.size, quality: p.clarity || p.quality || '', color: tone ? tone.name : '', toneHex: tone ? tone.color : '#9a8', unitMode: 'pc', ct: l.qty, qty: l.qty, perCtPrice: p.price, unitPrice: p.price, lineTotal: p.price * l.qty });
      n++;
    });
    return { n, id: order.id };
  };

  const pushAssistantTurn = (reply) => {
    const { clean, cartItems, go, reorder, escalate, images } = parseActions(reply || '');
    const out = [{ role: 'assistant', text: clean || 'Sorry, could you say that again?' }];
    if (images && images.length) images.forEach(im => out.push({ role: 'assistant', img: im.data, text: im.desc || '' }));
    if (reorder) { const r = applyReorder(reorder); if (r.n) out.push({ role: 'system', text: `✓ Reordered ${r.n} line${r.n > 1 ? 's' : ''} from ${r.id}.`, cta: 'cart' }); }
    if (cartItems && cartItems.length) { const added = applyCart(cartItems); if (added) out.push({ role: 'system', text: `✓ Added ${added} item${added > 1 ? 's' : ''} to your cart.`, cta: 'cart' }); }
    if (escalate) out.push({ role: 'system', text: 'Connect with your Eurostar rep', cta: 'rep' });
    setMsgs(m => [...m, ...out]);
    if (go && ['orders', 'rfq', 'franchise', 'home'].includes(go)) setTimeout(() => navigate({ name: go, tab: go === 'orders' ? 'cart' : undefined }), 600);
  };

  // Where the customer is standing, in words. Sent with every message so
  // "what's the 3 mm rate?" on a colour page answers that colour rather than
  // asking which of the twenty-nine categories was meant.
  const pageNote = () => {
    try {
      const r = route || {};
      const catName = (id) => {
        const c = (window.CATEGORIES || []).find((x) => x.id === id);
        return c ? `${c.name} (${id})` : id;
      };
      const bits = [];
      switch (r.name) {
        case 'home': bits.push('the shop home page, browsing categories'); break;
        case 'catalog': bits.push(`the ${catName(r.cat)} catalogue page`); break;
        case 'browse':
          bits.push(`the ordering flow for ${catName(r.cat)}`);
          if (r.grade) bits.push(`grade "${r.grade}"`);
          if (r.color) bits.push(`colour "${r.color}"`);
          if (r.shape) bits.push(`shape "${r.shape}"`);
          bits.push('choosing sizes and quantities');
          break;
        case 'product': bits.push(`a product page${r.pid ? ` for ${r.pid}` : ''}${r.cat ? ` in ${catName(r.cat)}` : ''}`); break;
        case 'orders': bits.push('their orders and cart'); break;
        case 'checkout': bits.push('the checkout page'); break;
        case 'payment': bits.push(`the payment page${r.order && r.order.id ? ` for order ${r.order.id}` : ''}`); break;
        case 'confirmation': bits.push('the order confirmation page'); break;
        case 'orderDetail': bits.push(`the detail page for order ${(r.order && r.order.id) || r.id || ''}`.trim()); break;
        case 'rfq': bits.push('the RFQ enquiry form'); break;
        case 'franchise': bits.push('the franchise enquiry page'); break;
        default: if (r.name) bits.push(`the ${r.name} page`);
      }
      if (cart && cart.length) bits.push(`${cart.length} line${cart.length > 1 ? 's' : ''} already in their cart`);
      return bits.length ? 'Sales App — ' + bits.join(' · ') : '';
    } catch (e) { return ''; }
  };

  const send = async (textOverride) => {
    const q = (textOverride != null ? textOverride : input).trim();
    if ((!q && !pendingImg) || busy) return;
    const userMsg = { role: 'user', text: q || 'Sent a photo', img: pendingImg };
    const next = [...msgs, userMsg];
    setMsgs(next); setInput(''); const imgNote = pendingImg ? ' (The customer attached a PHOTO of a stone — ask 1-2 clarifying questions about size/colour/shape to identify the category, then help.)' : '';
    setPendingImg(null); setBusy(true);
    try {
      const history = next.slice(-12).map(m => (m.role === 'user' ? 'Customer' : m.role === 'assistant' ? 'Mira' : '') + (m.text ? ': ' + m.text : '')).filter(Boolean).join('\n');
      // The back room answers, not the browser.
      //
      // This used to call window.claude.complete — an API that only exists
      // inside the preview harness, so on the real site the shop's Mira threw
      // "offline" on every message and the customer got the fallback line. It
      // was also a second brain: the office's instructions, rules and knowledge
      // live on the server, and this browser copy never saw them. One endpoint
      // now serves the shop, the CRM, the LMS and the phone app, and it reads
      // the live catalogue — prices, packing, photos — as it answers.
      const API = window.EUROSTAR_API || location.origin;
      const r = await fetch(API + '/assistant/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          app: 'sales',
          sessionId: sessionRef.current,
          who: persona.company,
          cust: (persona && persona.code) || '',
          contact: (persona && persona.contact) || '',
          // The shop-side facts the server cannot know: who is signed in, what
          // they have been buying, and the conversation so far.
          context: systemPrompt(),
          page: pageNote(),
          message: 'Conversation so far:\n' + history + imgNote + '\n\nReply as Mira to the last customer message.',
        }),
      });
      if (!r.ok) throw new Error('assistant unavailable');
      const data = await r.json();
      const reply = (data && data.reply) || '';
      if (!reply) throw new Error('empty reply');
      pushAssistantTurn(reply);
      try {
        const log = JSON.parse(localStorage.getItem('eurostar-mira-chatlog') || '[]');
        log.push({
          sessionId: sessionRef.current,
          cust: (persona && persona.code) || '',
          who: persona.company,
          contact: (persona && persona.contact) || '',
          q,
          a: (reply || '').replace(/<<[\s\S]*?<<END>>/g, '').trim(),
          ts: Date.now()
        });
        localStorage.setItem('eurostar-mira-chatlog', JSON.stringify(log.slice(-300)));
        // Push a clean turn to the back room so office staff see this chat in
        // Mira Admin from any device (not just this browser).
        const API = window.EUROSTAR_API || location.origin;
        fetch(API + '/assistant/chatlog', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ app: 'sales', sessionId: sessionRef.current, who: persona.company, cust: (persona && persona.code) || '', contact: (persona && persona.contact) || '', q, a: (reply || '').replace(/<<[\s\S]*?<<END>>/g, '').trim() }),
        }).catch(() => {});
      } catch (e) {}
    } catch (e) {
      setMsgs(m => [...m, { role: 'assistant', text: isOnline === false ? "You're offline right now — I'll be ready the moment you reconnect. You can still browse and queue orders." : "I couldn't reach the assistant just now. Please try again, or tap a category to order directly." }]);
    } finally { setBusy(false); }
  };

  // ---- voice input (Web Speech API) ----
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input is not supported in this browser.'); return; }
    if (listening && recRef.current) { recRef.current.stop(); return; }
    const rec = new SR(); recRef.current = rec; rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (ev) => { const t = ev.results[0][0].transcript; setInput(t); setTimeout(() => send(t), 50); };
    rec.onend = () => setListening(false); rec.onerror = () => setListening(false);
    setListening(true); rec.start();
  };

  // ---- photo input ----
  const onPhoto = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setPendingImg(r.result); r.readAsDataURL(f); e.target.value = '';
  };

  const repLink = (kind) => kind === 'wa' ? 'https://wa.me/919372342451' : 'tel:+919372342451';
  const quicks = ['Reorder my last order', 'Order white round CZ', 'Is 2.00 mm in stock?', 'What do I owe?', 'Track my order', 'I have a quality issue'];

  if (!miraOn) return null;

  return (
    <React.Fragment>
      {!open &&
      <button onClick={() => setOpen(true)} aria-label="Chat with Mira" style={{
        position: 'fixed', bottom: 22, right: 22, zIndex: 90, height: 58, paddingLeft: 16, paddingRight: 20,
        borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--emerald, #0E5C4A)', color: '#FDFAF2',
        display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(14,92,74,0.4)', fontFamily: 'inherit', fontWeight: 600, fontSize: 15 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>💬</span> Ask Mira
        {unread > 0 && <span aria-label={unread + ' new update'} style={{ position: 'absolute', top: -4, right: -4, minWidth: 22, height: 22, padding: '0 6px', borderRadius: 999, background: 'var(--ruby, #C0392B)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>{unread}</span>}
      </button>}

      {open &&
      <div style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 95, width: 'min(380px, calc(100vw - 28px))', height: 'min(600px, calc(100vh - 44px))',
        background: 'var(--paper, #FBF8F1)', borderRadius: 18, boxShadow: '0 16px 50px rgba(21,19,15,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border, #e4ddcd)' }}>
        <div style={{ background: 'var(--emerald, #0E5C4A)', color: '#FDFAF2', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💎</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Mira · Eurostar Assistant</div>
            <div style={{ fontSize: 11.5, color: 'rgba(253,250,242,0.8)' }}>{busy ? 'typing…' : listening ? 'listening…' : 'Online · in your language'}</div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'transparent', border: 'none', color: '#FDFAF2', cursor: 'pointer', fontSize: 20, padding: 4 }}>×</button>
        </div>

        <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map((m, i) => m.role === 'system'
            ? <div key={i} style={{ alignSelf: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, color: 'var(--emerald-ink, #0a3f33)', background: 'var(--emerald-soft, #e6f1ec)', borderRadius: 10, padding: '7px 12px', display: 'inline-block' }}>{m.text}</div>
                {m.cta === 'cart' && <div><button onClick={() => navigate({ name: 'orders', tab: 'cart' })} style={{ marginTop: 6, background: 'var(--emerald)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>View cart →</button></div>}
                {m.cta === 'rep' && <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <a href={repLink('tel')} style={{ background: 'var(--emerald)', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>📞 Call rep</a>
                  <a href={repLink('wa')} target="_blank" style={{ background: '#25D366', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
                </div>}
              </div>
            : <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%',
                background: m.role === 'user' ? 'var(--emerald, #0E5C4A)' : '#fff', color: m.role === 'user' ? '#FDFAF2' : 'var(--fg, #2a2620)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border, #e6ddcb)', borderRadius: 14, padding: '9px 13px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {m.img && <img src={m.img} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: m.text ? 6 : 0, display: 'block' }} />}
                {m.text}
              </div>
          )}
          {busy && <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid var(--border, #e6ddcb)', borderRadius: 14, padding: '10px 14px', color: 'var(--fg-meta, #8a8372)', fontSize: 14 }}>•••</div>}
        </div>

        {msgs.length <= 1 &&
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quicks.map(q => <button key={q} onClick={() => send(q)} style={{ background: 'var(--surface-2, #f2ede2)', border: '1px solid var(--border, #e4ddcd)', borderRadius: 999, padding: '6px 11px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--fg, #2a2620)' }}>{q}</button>)}
        </div>}

        {pendingImg &&
        <div style={{ padding: '0 12px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={pendingImg} alt="to send" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--fg-meta)' }}>Photo attached</span>
          <button onClick={() => setPendingImg(null)} style={{ background: 'transparent', border: 'none', color: 'var(--ruby, #8B1E2E)', cursor: 'pointer', fontSize: 12 }}>remove</button>
        </div>}

        <div style={{ padding: 12, borderTop: '1px solid var(--divider, #ece6da)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--paper, #FBF8F1)' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current && fileRef.current.click()} aria-label="Attach photo" style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border, #d8d2c4)', background: '#fff', cursor: 'pointer', fontSize: 16, flex: '0 0 38px', color: 'var(--fg-meta)' }}>📎</button>
          <button onClick={toggleVoice} aria-label="Voice" style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid ' + (listening ? 'var(--emerald)' : 'var(--border, #d8d2c4)'), background: listening ? 'var(--emerald)' : '#fff', cursor: 'pointer', fontSize: 16, flex: '0 0 38px', color: listening ? '#fff' : 'var(--fg-meta)' }}>🎤</button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Message Mira…" disabled={busy}
            style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 999, border: '1px solid var(--border, #d8d2c4)', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: 'var(--fg)', outline: 'none' }} />
          <button onClick={() => send()} disabled={busy || (!input.trim() && !pendingImg)} aria-label="Send" style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: (input.trim() || pendingImg) ? 'pointer' : 'default', background: (input.trim() || pendingImg) ? 'var(--emerald, #0E5C4A)' : 'var(--border, #d8d2c4)', color: '#fff', fontSize: 18, flex: '0 0 44px' }}>➤</button>
        </div>
      </div>}
    </React.Fragment>
  );
}

window.ChatAssistant = ChatAssistant;
