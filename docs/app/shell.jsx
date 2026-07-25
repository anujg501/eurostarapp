// shell.jsx — App shell (topbar, persona pill, navigation)

function UniversalSearch({ setRoute }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(0);
  const boxRef = React.useRef(null);

  // Build a flat search index across categories, grades and colours.
  const index = React.useMemo(() => {
    const rows = [];
    (window.CATEGORIES || []).forEach((c) => {
      rows.push({ cat: c.id, label: c.name, sub: 'Category', kw: (c.name + ' ' + (c.short || '') + ' ' + (c.blurb || '')).toLowerCase() });
      ((window.GRADES_BY_CATEGORY || {})[c.id] || []).forEach((g) =>
        rows.push({ cat: c.id, label: g.name, sub: c.short + ' · grade', kw: (g.name + ' ' + (g.desc || '')).toLowerCase() }));
      ((window.COLORS_BY_CATEGORY || {})[c.id] || []).forEach((col) =>
        rows.push({ cat: c.id, label: col.name, sub: c.short + ' · colour', kw: col.name.toLowerCase() }));
    });
    return rows;
  }, []);

  const results = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const seen = new Set();
    return index
      .filter((r) => r.kw.includes(s))
      .filter((r) => { const k = r.cat + '|' + r.label; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 8);
  }, [q, index]);

  React.useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const go = (r) => { setRoute({ name: 'browse', cat: r.cat }); setQ(''); setOpen(false); };
  const onKey = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[hi] || results[0]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className="usearch" ref={boxRef}>
      <div className="search-wrap">
        <IconSearch size={16} />
        <input className="search-input" type="text" placeholder="Search products, grades, colours…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)} onKeyDown={onKey} />
      </div>
      {open && q.trim() && (
        <div className="usearch-pop">
          {results.length === 0
            ? <div className="usearch-empty">No matches for &ldquo;{q}&rdquo; — try a category, grade or colour.</div>
            : results.map((r, i) => (
              <button key={r.cat + r.label + i} className={`usearch-row ${i === hi ? 'hi' : ''}`}
                onMouseEnter={() => setHi(i)} onClick={() => go(r)}>
                <span className="usearch-label">{r.label}</span>
                <span className="usearch-sub">{r.sub}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function LangSwitcher() {
  const LANGS = [
    { id:'en', native:'English',  en:'English',  ab:'EN' },
    { id:'hi', native:'हिन्दी',     en:'Hindi',    ab:'हि' },
    { id:'mr', native:'मराठी',     en:'Marathi',  ab:'म' },
    { id:'gu', native:'ગુજરાતી',   en:'Gujarati', ab:'ગુ' },
    { id:'ta', native:'தமிழ்',     en:'Tamil',    ab:'த' },
    { id:'te', native:'తెలుగు',    en:'Telugu',   ab:'తె' },
    { id:'kn', native:'ಕನ್ನಡ',     en:'Kannada',  ab:'ಕ' },
  ];
  const FONT = { en:'var(--font-sans)', hi:"'Noto Sans Devanagari',sans-serif", mr:"'Noto Sans Devanagari',sans-serif",
    gu:"'Noto Sans Gujarati',sans-serif", ta:"'Noto Sans Tamil',sans-serif", te:"'Noto Sans Telugu',sans-serif", kn:"'Noto Sans Kannada',sans-serif" };
  const [lang, setLang] = React.useState(() => { try { return localStorage.getItem('eurostar-lang') || 'en'; } catch (e) { return 'en'; } });
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);
  const cur = LANGS.find((l) => l.id === lang) || LANGS[0];
  const pick = (id) => { setLang(id); setOpen(false); try { localStorage.setItem('eurostar-lang', id); } catch (e) {} window.dispatchEvent(new Event('eurostar-lang')); };
  return (
    <div className="langsw" ref={ref}>
      <button className="icon-btn" aria-label="Language" onClick={() => setOpen((o) => !o)} title={`Language: ${cur.en}`}>
        <IconGlobe size={18} />
      </button>
      {open && (
        <div className="langsw-menu">
          <div className="langsw-head">Choose language</div>
          {LANGS.map((l) => (
            <button key={l.id} className={`langsw-row ${l.id === lang ? 'sel' : ''}`} onClick={() => pick(l.id)}>
              <span><span className="langsw-nat" style={{ fontFamily: FONT[l.id] }}>{l.native}</span> <span className="langsw-lat">{l.en}</span></span>
              {l.id === lang && <IconCheck size={15} />}
            </button>
          ))}
          <div className="langsw-note">Full translation rolling out · preview</div>
        </div>
      )}
    </div>
  );
}

function TopBar({ route, setRoute, persona, cartCount, onOpenTweaks }) {
  const lang = (window.currentLang ? window.currentLang() : 'en');
  const T = (k, fb) => (window.t ? window.t(k, lang) : fb);
  const navItems = [
    { id: 'home',     label: T('nav_home', 'Home') },
    { id: 'orders',   label: T('nav_orders', 'Orders') },
    { id: 'rfq',      label: T('nav_rfq', 'RFQ Enquiry') },
    { id: 'franchise', label: T('nav_franchise', 'Join Franchise') },
  ];
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div onClick={() => setRoute({ name: 'home' })}>
          <EurostarLogo size={22} />
        </div>
        <nav className="topbar-nav">
          {navItems.map(n => (
            <div key={n.id}
                 className={`topbar-link ${route.name === n.id ? 'active' : ''} ${n.id === 'rfq' ? 'desktop-only' : ''}`}
                 onClick={() => setRoute({ name: n.id })}>
              {n.label}
            </div>
          ))}
        </nav>
        <UniversalSearch setRoute={setRoute} />
        <div className="topbar-right">
          {(() => {
            // Staff (rep / back office) see their OWN name here, not a customer account.
            let mode = 'customer', repName = '', repId = '';
            try {
              mode = localStorage.getItem('eurostar_login_mode') || 'customer';
              // The signed-in user carries the real name/repId (set at login and
              // when the CRM hands the session across). Prefer it over the older
              // standalone keys, which the CRM hand-off never wrote — that left
              // the chip showing a generic "Sales Rep" instead of the rep's name.
              var who = JSON.parse(localStorage.getItem('eurostar_user') || 'null');
              repName = (who && who.name) || localStorage.getItem('eurostar-rep-name') || '';
              repId = (who && who.repId) || localStorage.getItem('eurostar-rep-id') || '';
            } catch (e) {}
            const isRep = mode === 'rep-cash', isOffice = mode === 'office';
            const staff = isRep || isOffice;
            const name = staff ? (repName || (isOffice ? 'Back Office' : 'Sales Rep')) : persona.company;
            const sub = isRep ? ('Sales Rep' + (repId ? ' · ' + repId : '')) : isOffice ? 'Back Office' : persona.tier;
            const initials = staff
              ? (name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'ES')
              : persona.initials;
            return (
          <div className="persona-pill" title={staff ? (name + (repId ? ' · ' + repId : '')) : `${persona.company} · ${persona.code}`}
               style={{ cursor: 'pointer' }} onClick={() => setRoute({ name: 'profile' })}>
            <span style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--fg-meta)' }}>{sub}</span>
            </span>
            <div className="persona-avatar">{initials}</div>
          </div>
            );
          })()}
          <button className="icon-btn" aria-label="Notifications">
            <IconBell size={18} />
          </button>
          <LangSwitcher />
          <button className="icon-btn" aria-label="Cart" onClick={() => setRoute({ name: 'orders' })}>
            <IconBag size={18} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { TopBar });
