/* Eurostar Fine — storefront (no build step; plain JS, hash routing). */
(function () {
  const P = window.FinePricing, A = window.FineArt;
  const { COLLECTIONS, KINDS, DESIGNS } = window.FineDesigns;
  const GEMS = P.GEMS, METALS = P.GOLD_COLOURS;
  const WHATSAPP = '919372342451';
  const RING_SIZES = [6, 8, 10, 12, 14, 16, 18, 20, 22];
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const NACRE = new Set(['mopClover', 'pinkClover']);
  const $app = document.getElementById('app');
  const byId = Object.fromEntries(DESIGNS.map((d) => [d.id, d]));
  const collById = Object.fromEntries(COLLECTIONS.map((c) => [c.id, c]));

  // ---------- storage (per-viewer convenience only) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('fine.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('fine.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  let bag = store.get('bag', []);
  const saveBag = () => { store.set('bag', bag); paintBagCount(); };

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inr = P.inr;
  const fmtDate = (iso) => { const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const sizeLabel = (s) => s.replace(/x/g, ' × ').replace('mm', ' mm');
  const choiceSlot = (d) => d.stones.find((s) => s.choose);
  const defaultChoice = (d) => ({ karat: 14, metal: 'yellow', gem: choiceSlot(d) ? choiceSlot(d).choose[0] : null, size: d.kind === 'ring' ? 12 : null, letter: d.letters ? 'A' : null });

  function artSpec(d, ch) {
    const a = Object.assign({}, d.art);
    const slot = choiceSlot(d);
    const mainGem = slot ? (ch.gem || slot.choose[0]) : (d.stones[0].gem || null);
    if (mainGem) a.gem = GEMS[mainGem].hex;
    const mixSlot = d.stones.find((s) => s.mix);
    if (mixSlot) a.mix = mixSlot.mix.map((g) => GEMS[g].hex);
    const acc = d.stones.find((s) => s.gem === 'moissanite');
    a.accent = acc ? GEMS.moissanite.hex : a.gem;
    a.nacre = NACRE.has(mainGem) || mainGem === 'mop';
    if (ch.letter) a.letter = ch.letter;
    return a;
  }
  const art = (d, ch) => `<div class="art">${A.render(artSpec(d, ch), METALS[ch.metal || 'yellow'])}</div>`;

  function gemSummary(d, ch) {
    const slot = choiceSlot(d);
    if (slot) return GEMS[ch.gem || slot.choose[0]].label;
    const mix = d.stones.find((s) => s.mix);
    if (mix) return 'Lab-grown rainbow sapphires, ruby & emerald';
    return [...new Set(d.stones.map((s) => GEMS[s.gem].label))].join(' · ');
  }

  function card(d) {
    const ch = defaultChoice(d);
    const slot = choiceSlot(d);
    const dots = slot ? `<div class="dots">${slot.choose.slice(0, 7).map((g) => `<span class="dot" style="background:${GEMS[g].hex}" title="${esc(GEMS[g].label)}"></span>`).join('')}${slot.choose.length > 7 ? `<span class="sub">+${slot.choose.length - 7}</span>` : ''}</div>` : '';
    return `<a class="card" href="#/p/${d.id}">
      <div class="art-frame"><span class="tag">${esc(collById[d.collection].name)}</span>${art(d, ch)}</div>
      <h3>${esc(d.name)}</h3>
      <div class="sub">${esc(gemSummary(d, ch))}</div>
      <div class="price">From ${inr(P.fromPrice(d))}</div>${dots}
    </a>`;
  }

  // ---------- views ----------
  const HERO_GEMS = ['moissanite', 'emerald', 'ruby', 'sapphire', 'padparadscha', 'paraiba'];
  let heroTimer = null;

  function viewHome() {
    const featured = ['aurelia-solitaire', 'spectrum-half-eternity', 'lucky-clover-pendant', 'luna-pearl-huggies', 'nazar-pendant', 'polki-band', 'riviera-tennis', 'bindu-nose-pin'].map((id) => byId[id]);
    const hero = byId['aurelia-solitaire'];
    $app.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">14K &amp; 18K gold · Made to order</div>
          <h1 class="serif">Fine gold,<br>set with <em>colour</em>.</h1>
          <p>Jewellery designed in-house and set with gems hand-picked from the Eurostar Gems vault. Priced openly: gold at today's rate, a flat making charge, and nothing hidden.</p>
          <div class="cta-row"><a class="btn" href="#/shop">Shop the collection</a><a class="link" href="#/pricing">How we price</a></div>
        </div>
        <div class="hero-art"><div id="hero-stage">${art(hero, { metal: 'yellow', gem: 'moissanite' })}</div><div class="caption" id="hero-cap">Aurelia Solitaire · Moissanite</div></div>
      </section>

      <section class="block"><div class="wrap">
        <div class="section-head"><div><div class="eyebrow">The collections</div><h2>Six ways to wear it</h2></div><a class="link" href="#/shop">View all ${DESIGNS.length} pieces</a></div>
        <div class="collections">${COLLECTIONS.map((c) => {
          const d = DESIGNS.find((x) => x.collection === c.id);
          return `<a class="coll" href="#/c/${c.id}"><div class="art-frame" style="background:${c.tone}">${art(d, defaultChoice(d))}</div>
            <div class="meta"><h3>${esc(c.name)}</h3><p>${esc(c.line)}</p></div></a>`;
        }).join('')}</div>
      </div></section>

      <section class="block" style="padding-top:0"><div class="wrap">
        <div class="section-head"><div><div class="eyebrow">Most loved</div><h2>Begin here</h2></div></div>
        <div class="grid">${featured.map(card).join('')}</div>
      </div></section>

      <section class="block" style="padding-top:0"><div class="wrap">
        <div class="section-head"><div><div class="eyebrow">Transparent pricing</div><h2>Every rupee, explained</h2></div><a class="link" href="#/pricing">Today's gold rate</a></div>
        <div class="formula">
          <div><div class="n">01</div><h4>Gold at today's rate</h4><p>Weight × the live 24K rate × purity (58.5% for 14K, 75% for 18K).</p></div>
          <div><div class="n">02</div><h4>Flat making, no wastage</h4><p>${inr(P.CONFIG.makingPerGram)} per gram on every piece. No wastage charge, ever.</p></div>
          <div><div class="n">03</div><h4>Gems from our vault</h4><p>Moissanite, lab-grown sapphires and natural nacre, sourced directly from Eurostar Gems.</p></div>
          <div><div class="n">04</div><h4>3% GST</h4><p>Shown on every product before you add it to your bag.</p></div>
        </div>
      </div></section>

      <section class="quote"><div class="wrap">
        <blockquote>“We have cut and sold gems to India's jewellers for years. Now we set them ourselves.”</blockquote>
        <div class="eyebrow">Eurostar Gems</div>
      </div></section>

      <div class="wrap">${trustStrip()}</div>`;

    let i = 0;
    clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      const stage = document.getElementById('hero-stage');
      if (!stage) return clearInterval(heroTimer);
      i = (i + 1) % HERO_GEMS.length;
      const g = HERO_GEMS[i];
      stage.innerHTML = art(hero, { metal: i % 3 === 1 ? 'rose' : i % 3 === 2 ? 'white' : 'yellow', gem: g });
      document.getElementById('hero-cap').textContent = 'Aurelia Solitaire · ' + GEMS[g].label;
    }, 3800);
  }

  function trustStrip() {
    return `<div class="trust">
      <div><h4>BIS Hallmarked</h4><p>Every piece carries a HUID hallmark</p></div>
      <div><h4>Honestly labelled</h4><p>Moissanite, lab-grown or natural, always stated</p></div>
      <div><h4>Free resizing</h4><p>One free resize within 60 days</p></div>
      <div><h4>Lifetime exchange</h4><p>Gold value credited at the day's rate</p></div>
    </div>`;
  }

  function viewList(title, eyebrow, blurb, items, kindFilter, baseHash) {
    const kinds = [...new Set(items.map((d) => d.kind))];
    const shown = kindFilter ? items.filter((d) => d.kind === kindFilter) : items;
    $app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(blurb)}</p></div>
        ${kinds.length > 1 ? `<div class="filters"><a class="chip ${!kindFilter ? 'on' : ''}" href="${baseHash}">All</a>${kinds.map((k) => `<a class="chip ${kindFilter === k ? 'on' : ''}" href="${baseHash}?k=${k}">${KINDS[k]}</a>`).join('')}</div>` : '<div class="filters"></div>'}
        ${shown.length ? `<div class="grid">${shown.map(card).join('')}</div>` : '<div class="empty">Nothing here yet.</div>'}
        <div style="height:96px"></div>
      </div>`;
  }

  // Product page: choices live in `ch`; repaint only what changes.
  function viewProduct(d) {
    if (!d) return viewNotFound();
    const ch = defaultChoice(d);
    const slot = choiceSlot(d);
    const coll = collById[d.collection];

    $app.innerHTML = `
      <div class="wrap">
        <div class="crumbs"><a href="#/">Home</a> / <a href="#/c/${coll.id}">${esc(coll.name)}</a> / ${esc(d.name)}</div>
        <div class="pdp">
          <div class="pdp-art"><div class="stage" id="stage" style="background:${coll.tone}"></div>
            <div class="note">Illustration of the design. Each piece is cast to order, so your piece will be photographed before dispatch.</div></div>
          <div>
            <div class="eyebrow">${esc(coll.name)} · ${esc(KINDS[d.kind].replace(/s$/, ''))}</div>
            <h1>${esc(d.name)}</h1>
            <p class="story">${esc(d.story)}</p>
            <div class="price-now" id="price"></div>
            <div class="price-note" id="price-note"></div>

            <div class="opt"><div class="opt-label">Gold purity <b id="karat-l"></b></div>
              <div class="seg" id="karat">${[14, 18].map((k) => `<button data-k="${k}">${k}K</button>`).join('')}</div></div>
            <div class="opt"><div class="opt-label">Gold colour <b id="metal-l"></b></div>
              <div class="swatches" id="metal">${Object.entries(METALS).map(([id, m]) => `<button class="sw" data-m="${id}" aria-label="${m.label}"><i style="background:linear-gradient(135deg,${m.light},${m.mid} 55%,${m.dark})"></i></button>`).join('')}</div></div>
            ${slot ? `<div class="opt"><div class="opt-label">${esc(slot.role === 'Pair' ? 'Stone' : slot.role)} <b id="gem-l"></b></div>
              <div class="swatches" id="gem">${slot.choose.map((g) => `<button class="sw" data-g="${g}" aria-label="${esc(GEMS[g].label)}" title="${esc(GEMS[g].label)}"><i style="background:${GEMS[g].hex}"></i></button>`).join('')}</div></div>` : ''}
            ${d.kind === 'ring' ? `<div class="opt"><div class="opt-label">Ring size (Indian) <b id="size-l"></b></div>
              <div class="sizes" id="size">${RING_SIZES.map((s) => `<button data-s="${s}">${s}</button>`).join('')}</div></div>` : ''}
            ${d.letters ? `<div class="opt"><div class="opt-label">Initial</div><select class="letter" id="letter">${LETTERS.map((l) => `<option>${l}</option>`).join('')}</select></div>` : ''}

            <div class="add-row"><button class="btn block" id="add">Add to bag</button>
              <a class="btn ghost block" id="ask" target="_blank" rel="noopener">Ask a designer on WhatsApp</a></div>
            <ul class="small-print"><li>Made to order, dispatched in 12–15 working days</li><li>BIS hallmark (HUID) and gem card included</li><li>Insured shipping across India</li></ul>

            <details class="breakdown" id="bd-wrap"><summary>Price breakdown</summary><div id="bd"></div></details>
            <dl class="specs" id="specs"></dl>
          </div>
        </div>
      </div>`;

    const paint = () => {
      const q = P.quote(d, ch);
      document.getElementById('stage').innerHTML = art(d, ch);
      document.getElementById('price').textContent = inr(q.total);
      document.getElementById('price-note').textContent = `Incl. 3% GST · gold rate as of ${fmtDate(q.rateAsOf)}`;
      document.getElementById('karat-l').textContent = ch.karat === 18 ? '18K · 75% gold' : '14K · 58.5% gold';
      document.getElementById('metal-l').textContent = METALS[ch.metal].label;
      document.querySelectorAll('#karat button').forEach((b) => b.classList.toggle('on', +b.dataset.k === ch.karat));
      document.querySelectorAll('#metal .sw').forEach((b) => b.classList.toggle('on', b.dataset.m === ch.metal));
      if (slot) {
        document.getElementById('gem-l').textContent = GEMS[ch.gem].label;
        document.querySelectorAll('#gem .sw').forEach((b) => b.classList.toggle('on', b.dataset.g === ch.gem));
      }
      if (d.kind === 'ring') {
        document.getElementById('size-l').textContent = ch.size;
        document.querySelectorAll('#size button').forEach((b) => b.classList.toggle('on', +b.dataset.s === ch.size));
      }
      const purity = P.CONFIG.purity[ch.karat];
      document.getElementById('bd').innerHTML = `<table class="bd">
        <tr><td>Gold ${ch.karat}K<div class="muted">${q.grams.toFixed(2)} g × ${inr(q.rate24)}/g (24K) × ${(purity * 100).toFixed(1)}%</div></td><td>${inr(q.gold)}</td></tr>
        <tr><td>Making<div class="muted">${q.grams * P.CONFIG.makingPerGram >= P.CONFIG.minMakingPerPiece ? `${q.grams.toFixed(2)} g × ${inr(P.CONFIG.makingPerGram)}/g` : `Minimum per piece (${inr(P.CONFIG.minMakingPerPiece)})`}, no wastage</div></td><td>${inr(q.making)}</td></tr>
        ${q.lines.map((l) => `<tr><td>${esc(l.label)}<div class="muted">${l.qty} × ${esc(sizeLabel(l.size))}${GEMS[l.gem].unit === 'set' ? ' set' : ''} · ${esc(l.role)}</div></td><td>${l.each == null ? '—' : inr(l.each * l.qty)}</td></tr>`).join('')}
        <tr><td>GST 3%</td><td>${inr(q.gst)}</td></tr>
        <tr class="total"><td>Total (rounded)</td><td>${inr(q.total)}</td></tr></table>`;
      document.getElementById('specs').innerHTML = `
        <div><dt>Est. gold weight</dt><dd>${q.grams.toFixed(2)} g (${ch.karat}K)</dd></div>
        <div><dt>Stones</dt><dd>${q.lines.map((l) => `${l.qty} × ${esc(GEMS[l.gem].label)}`).join('<br>')}</dd></div>
        <div><dt>Gem details</dt><dd>${[...new Set(q.lines.map((l) => GEMS[l.gem].note))].map(esc).join(' · ')}</dd></div>
        <div><dt>Weight note</dt><dd>Cast weight can vary ±5%. Your price is fixed when you order.</dd></div>`;
      const msg = `Hello Eurostar Fine, I'd like to know more about: ${d.name} — ${ch.karat}K ${METALS[ch.metal].label}${slot ? ', ' + GEMS[ch.gem].label : ''}${ch.size ? ', ring size ' + ch.size : ''}${ch.letter ? ', initial ' + ch.letter : ''}. Price shown ${inr(q.total)}.`;
      document.getElementById('ask').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
      return q;
    };

    document.getElementById('karat').onclick = (e) => { const b = e.target.closest('button'); if (b) { ch.karat = +b.dataset.k; paint(); } };
    document.getElementById('metal').onclick = (e) => { const b = e.target.closest('button'); if (b) { ch.metal = b.dataset.m; paint(); } };
    if (slot) document.getElementById('gem').onclick = (e) => { const b = e.target.closest('button'); if (b) { ch.gem = b.dataset.g; paint(); } };
    if (d.kind === 'ring') document.getElementById('size').onclick = (e) => { const b = e.target.closest('button'); if (b) { ch.size = +b.dataset.s; paint(); } };
    if (d.letters) document.getElementById('letter').onchange = (e) => { ch.letter = e.target.value; paint(); };
    document.getElementById('add').onclick = () => {
      const q = paint();
      bag.push({ id: d.id, choice: Object.assign({}, ch), price: q.total, at: Date.now() });
      saveBag();
      toast(`${d.name} added to your bag`);
    };
    paint();
  }

  function viewBag() {
    const items = bag.filter((it) => byId[it.id]);
    if (!items.length) {
      $app.innerHTML = `<div class="wrap"><div class="page-head"><div class="eyebrow">Your bag</div><h1>Your bag is empty</h1><p>Every piece is made for you, so take your time.</p></div><div style="text-align:center;padding-bottom:120px"><a class="btn" href="#/shop">Explore the collection</a></div></div>`;
      return;
    }
    // Re-quote at today's rate so the bag always shows the current price.
    const rows = items.map((it) => ({ it, d: byId[it.id], q: P.quote(byId[it.id], it.choice) }));
    const total = rows.reduce((s, r) => s + r.q.total, 0);
    const gst = rows.reduce((s, r) => s + r.q.gst, 0);
    const lines = rows.map((r, i) => `${i + 1}. ${r.d.name} — ${r.it.choice.karat}K ${METALS[r.it.choice.metal].label}${r.it.choice.gem ? ', ' + GEMS[r.it.choice.gem].label : ''}${r.it.choice.size ? ', size ' + r.it.choice.size : ''}${r.it.choice.letter ? ', initial ' + r.it.choice.letter : ''} — ${inr(r.q.total)}`).join('\n');
    const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hello Eurostar Fine, I would like to order:\n' + lines + '\nTotal ' + inr(total))}`;
    $app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><div class="eyebrow">Your bag</div><h1>${items.length} piece${items.length > 1 ? 's' : ''}</h1></div>
        <div class="bag">
          <div>${rows.map((r, i) => `<div class="bag-item">
              <a class="art-frame" href="#/p/${r.d.id}">${art(r.d, r.it.choice)}</a>
              <div><h3>${esc(r.d.name)}</h3>
                <div class="sub">${r.it.choice.karat}K ${METALS[r.it.choice.metal].label}${r.it.choice.gem ? ' · ' + esc(GEMS[r.it.choice.gem].label) : ''}${r.it.choice.size ? ' · Size ' + r.it.choice.size : ''}${r.it.choice.letter ? ' · Initial ' + r.it.choice.letter : ''}</div>
                <div class="sub">${r.q.grams.toFixed(2)} g gold · made to order</div>
                <button class="rm" data-i="${i}">Remove</button></div>
              <div>${inr(r.q.total)}</div></div>`).join('')}</div>
          <aside class="summary">
            <h2>Summary</h2>
            <div class="row"><span>Subtotal</span><span>${inr(total - gst)}</span></div>
            <div class="row"><span>GST (3%)</span><span>${inr(gst)}</span></div>
            <div class="row"><span>Insured shipping</span><span>Free</span></div>
            <div class="row total"><span>Total</span><span>${inr(total)}</span></div>
            <p class="sub" style="font-size:12px;color:var(--ink-3);margin:14px 0 20px">Prices follow today's gold rate (${fmtDate(P.rateAsOf)}) and are fixed once your order is confirmed.</p>
            <a class="btn block" href="${wa}" target="_blank" rel="noopener">Place order on WhatsApp</a>
            <p style="font-size:12px;color:var(--ink-3);margin:12px 0 0;text-align:center">Secure online payment is coming soon.</p>
          </aside>
        </div>
      </div>`;
    $app.querySelectorAll('.rm').forEach((b) => b.onclick = () => {
      const it = items[+b.dataset.i];
      bag = bag.filter((x) => x !== it);
      saveBag();
      viewBag();
    });
  }

  function viewPricing() {
    const g = P.gold24, c = P.CONFIG;
    $app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><div class="eyebrow">Transparent pricing</div><h1>How we price</h1><p>No wastage, no hidden charges, no "price on request". Every product page shows its full breakdown.</p></div>
        <div class="prose">
          <div class="rate-box">
            <div><div class="eyebrow">24K · per gram</div><div class="v">${inr(g)}</div></div>
            <div><div class="eyebrow">18K · per gram</div><div class="v">${inr(g * c.purity[18])}</div></div>
            <div><div class="eyebrow">14K · per gram</div><div class="v">${inr(g * c.purity[14])}</div></div>
          </div>
          <p style="font-size:13px;color:var(--ink-3);margin-top:-14px">Rate as of ${fmtDate(P.rateAsOf)}. Updated regularly from Indian market rates.</p>
          <h2>1. Gold</h2><p>The design's gold weight × today's 24K rate × purity. 14K is 58.5% pure gold and 18K is 75%. 18K is also a denser alloy, so the same design weighs about ${Math.round((c.density18over14 - 1) * 100)}% more in 18K.</p>
          <h2>2. Making</h2><p>A flat ${inr(c.makingPerGram)} per gram, the same on every design, with a minimum of ${inr(c.minMakingPerPiece)} per piece so our karigars are paid fairly for even the tiniest work. We never add a wastage charge.</p>
          <h2>3. Gems</h2><p>Every stone comes from the Eurostar Gems vault, where we have supplied India's jewellers for years. We tell you exactly what each stone is: moissanite, lab-grown, created, or natural.</p>
          <h2>4. GST</h2><p>3% GST on the total, as required for jewellery in India, shown on every product page.</p>
          <h2>Why the price can change</h2><p>Gold moves every day, so prices on the site follow it. Once you place an order, your price is fixed, even if your cast piece comes out slightly heavier.</p>
          <div style="margin-top:40px"><a class="btn" href="#/shop">Shop the collection</a></div>
        </div>
      </div>`;
  }

  function viewNotFound() {
    $app.innerHTML = `<div class="wrap"><div class="page-head"><h1>Not found</h1><p>That page has moved or never existed.</p></div><div style="text-align:center;padding-bottom:120px"><a class="btn" href="#/">Home</a></div></div>`;
  }

  // ---------- chrome ----------
  function paintBagCount() {
    const n = bag.filter((it) => byId[it.id]).length;
    document.querySelectorAll('.bag-count').forEach((el) => { el.textContent = n; });
  }
  let toastT;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400);
  }

  function route() {
    const [path, qs] = (location.hash.replace(/^#/, '') || '/').split('?');
    const params = new URLSearchParams(qs || '');
    const parts = path.split('/').filter(Boolean);
    clearInterval(heroTimer);
    document.getElementById('nav').classList.remove('open');
    document.querySelectorAll('nav.main a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + path));
    let title = 'Eurostar Fine';
    if (!parts.length) viewHome();
    else if (parts[0] === 'shop') { viewList('The Collection', `${DESIGNS.length} pieces · 14K & 18K`, 'Every design is made to order in your choice of gold purity and colour.', DESIGNS, params.get('k'), '#/shop'); title = 'Shop · Eurostar Fine'; }
    else if (parts[0] === 'c' && collById[parts[1]]) { const c = collById[parts[1]]; viewList(c.name, c.line, c.blurb, DESIGNS.filter((d) => d.collection === c.id), params.get('k'), '#/c/' + c.id); title = c.name + ' · Eurostar Fine'; }
    else if (parts[0] === 'p') { viewProduct(byId[parts[1]]); if (byId[parts[1]]) title = byId[parts[1]].name + ' · Eurostar Fine'; }
    else if (parts[0] === 'bag') { viewBag(); title = 'Bag · Eurostar Fine'; }
    else if (parts[0] === 'pricing') { viewPricing(); title = 'Pricing · Eurostar Fine'; }
    else viewNotFound();
    document.title = title;
    window.scrollTo(0, 0);
  }

  async function boot() {
    const get = (u) => fetch(u, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [snapshot, weights, goldRate] = await Promise.all([get('../price-snapshot.json'), get('moiss-weights.json'), get('gold-rate.json')]);
    if (!snapshot) {
      $app.innerHTML = '<div class="wrap"><div class="page-head"><h1>We\'ll be right back</h1><p>Prices could not be loaded. Please refresh in a moment.</p></div></div>';
      return;
    }
    P.init({ snapshot, weights, goldRate });
    document.getElementById('rate-line').textContent = `24K gold today ${inr(P.gold24)}/g`;
    document.getElementById('menu').onclick = () => document.getElementById('nav').classList.toggle('open');
    window.addEventListener('hashchange', route);
    paintBagCount();
    route();
  }
  boot();
})();
