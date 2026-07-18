// app.jsx — Top-level router + state for the Eurostar wholesale portal

// Resilience guard: if tweaks-panel.jsx fails to load (intermittent preview
// fetch failures), provide a no-op useTweaks so the portal still renders on
// default values instead of crashing to a blank screen.
if (typeof useTweaks === 'undefined') {
  window.useTweaks = function (defaults) {
    return Object.assign({}, defaults, { setTweak: function () {} });
  };
}

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "persona": "kiran",
  "accent": "emerald",
  "headtint": "plain",
  "density": "comfortable",
  "simOffline": false
}/*EDITMODE-END*/;

function App() {
  const tweaks = useTweaks(TWEAKS_DEFAULTS);
  const persona = PERSONAS[tweaks.persona] || PERSONAS.kiran;
  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-accent', tweaks.accent || 'emerald');
    r.setAttribute('data-headtint', tweaks.headtint || 'plain');
    r.setAttribute('data-density', tweaks.density || 'comfortable');
  }, [tweaks.accent, tweaks.headtint, tweaks.density]);
  const [, setLangTick] = React.useState(0);
  React.useEffect(() => {
    const f = () => setLangTick((n) => n + 1);
    window.addEventListener('eurostar-lang', f);
    return () => window.removeEventListener('eurostar-lang', f);
  }, []);

  // Route shape: { name: 'home' | 'catalog' | 'product' | 'orders' | 'order-detail' | 'rfq', pid?, oid?, filter? }
  const [route, setRoute] = React.useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('editCart')) return { name: 'orders', tab: 'cart', editCart: p.get('editCart'), editCustomer: p.get('customer') || '' };
    } catch (e) {}
    return { name: 'home' };
  });
  // The cart survives refreshes: whatever the user last had (including an
  // emptied cart) is restored from localStorage. The sample cart only seeds
  // the very first visit, before any cart has ever been saved.
  const [cart, setCart] = React.useState(() => {
    try {
      const raw = localStorage.getItem('eurostar-cart');
      if (raw !== null) return JSON.parse(raw) || [];
    } catch (e) {}
    return sampleCart();
  });
  React.useEffect(() => {
    try { localStorage.setItem('eurostar-cart', JSON.stringify(cart)); } catch (e) {}
  }, [cart]);
  const [wishlist, setWishlist] = React.useState(new Set());
  const [toast, setToast] = React.useState(null);

  // ----- Offline order queueing -----
  const [netOnline, setNetOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isOnline = netOnline && !tweaks.simOffline;
  const [queued, setQueued] = React.useState(() => { try { return (JSON.parse(localStorage.getItem('eurostar-offline-orders') || '[]') || []).length; } catch (e) { return 0; } });
  const syncQueue = React.useCallback(() => {
    let q; try { q = JSON.parse(localStorage.getItem('eurostar-offline-orders') || '[]') || []; } catch (e) { q = []; }
    if (!q.length) { setQueued(0); return; }
    try {
      const k = 'eurostar-crm-incoming-orders';
      const arr = JSON.parse(localStorage.getItem(k) || '[]') || [];
      q.forEach((o) => { if (!arr.some((x) => x.id === o.id)) arr.unshift({ ...o, queuedOffline: false }); });
      localStorage.setItem(k, JSON.stringify(arr));
    } catch (e) {}
    localStorage.setItem('eurostar-offline-orders', '[]');
    setQueued(0);
    setToast({ kind: 'sync', count: q.length });
    setTimeout(() => setToast(null), 3600);
  }, []);
  React.useEffect(() => {
    const up = () => setNetOnline(true); const down = () => setNetOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  React.useEffect(() => { if (isOnline && queued > 0) syncQueue(); }, [isOnline]);

  const navigate = (next) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const addToCart = (line) => {
    setCart(c => [...c, { ...line, addedAt: Date.now() + Math.random() }]);
    setToast({ kind: 'cart', name: line.name, qty: line.qty, ct: line.ct });
    setTimeout(() => setToast(null), 3200);
  };

  const toggleWishlist = (pid) => {
    setWishlist(w => {
      const next = new Set(w);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  let screen;
  switch (route.name) {
    case 'home':
      screen = <HomeScreen persona={persona} setRoute={navigate} />;
      break;
    case 'catalog':
      screen = <CatalogScreen route={route} setRoute={navigate} persona={persona}
                              addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist} />;
      break;
    case 'browse':
      screen = <BrowseScreen route={route} setRoute={navigate} persona={persona}
                             addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist} />;
      break;
    case 'product':
      screen = <ProductScreen route={route} setRoute={navigate}
                              addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist} />;
      break;
    case 'orders':
      screen = <OrdersScreen persona={persona} setRoute={navigate} cart={cart} setCart={setCart}
                             initialTab={route.tab} editCart={route.editCart} editCustomer={route.editCustomer} />;
      break;
    case 'checkout':
      screen = <CheckoutScreen cart={cart} persona={persona} isOnline={isOnline}
                  onBack={() => navigate({ name: 'orders', tab: 'cart' })}
                  onPlace={(details) => {
                    const id = 'SO-' + (24900 + Math.floor(Math.random() * 90));
                    const isCredit = ['15','30','45','60'].includes(String(persona.terms));
                    if (!isOnline) {
                      const o = { id, customer: persona.company, code: persona.code || '', city: (persona.location || '').split(',')[0].trim(), rep: localStorage.getItem('eurostar-rep-name') || 'Rohit Shah', repId: localStorage.getItem('eurostar-rep-id') || 'REP-204', value: details.grand || 0, dispatchBy: details.dispatchBy || '', isExport: !!details.isExport, paid: false, ts: Date.now(), source: 'Sales App', queuedOffline: true };
                      try { const q = JSON.parse(localStorage.getItem('eurostar-offline-orders') || '[]') || []; q.push(o); localStorage.setItem('eurostar-offline-orders', JSON.stringify(q)); } catch (e) {}
                      setQueued((n) => n + 1);
                      setCart([]);
                      navigate({ name: 'confirmed', order: { id, ...details, queuedOffline: true } });
                      return;
                    }
                    setCart([]);
                    if (isCredit) navigate({ name: 'confirmed', order: { id, ...details } });
                    else navigate({ name: 'payment', order: { id, ...details } });
                  }} />;
      break;
    case 'payment':
      screen = <PaymentScreen order={route.order || { id: 'SO-24900', grand: 0 }} persona={persona}
                  onPaid={() => navigate({ name: 'confirmed', order: { ...(route.order || {}), paid: true } })}
                  onBack={() => navigate({ name: 'checkout' })} />;
      break;
    case 'confirmed':
      screen = <ConfirmationScreen order={route.order || { id: 'SO-24900', grand: 0, dispatchBy: '', isExport: false }} persona={persona} setRoute={navigate} />;
      break;
    case 'order-detail':
      screen = <OrderDetailScreen route={route} setRoute={navigate} persona={persona} addToCart={addToCart} />;
      break;
    case 'rfq':
      screen = <RfqStub setRoute={navigate} />;
      break;
    case 'franchise':
      screen = <FranchiseScreen setRoute={navigate} />;
      break;
    case 'profile':
      screen = <ProfileScreen persona={persona} setRoute={navigate} />;
      break;
    default:
      screen = <HomeScreen persona={persona} setRoute={navigate} />;
  }

  return (
    <div className="app-root">
      <SplashPopup />
      <TopBar route={route} setRoute={navigate} persona={persona} cartCount={cart.length} />
      <OfflineBar isOnline={isOnline} queued={queued} onSync={syncQueue} />
      {screen}
      <ChatAssistant persona={persona} cart={cart} addToCart={addToCart} navigate={navigate} isOnline={isOnline} />

      <Footer />

      <PersonaTweaksPanel tweaks={tweaks} persona={persona} />

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)}
                       onView={() => { setToast(null); navigate({ name: 'orders' }); }} />}
    </div>
  );
}

function PersonaTweaksPanel({ tweaks, persona }) {
  return (
    <TweaksPanel title="Sample data" defaultOpen={false}>
      <TweakSection label="Field conditions"
        description="Simulate poor connectivity. When offline, placing an order saves it to a local queue that auto-syncs when the connection returns.">
        <TweakToggle label="Simulate offline" value={tweaks.simOffline} onChange={(v) => tweaks.setTweak('simOffline', v)} />
      </TweakSection>
      <TweakSection label="Appearance"
        description="Give the storefront its own colour scheme and density.">
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta)', margin: '2px 0 8px' }}>Accent palette</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['emerald','#0E5C4A'],['sapphire','#1E3A8A'],['ruby','#8B1E2E'],['amber','#B7791F'],['plum','#6D2D6B']].map(([id,hex]) => (
            <button key={id} title={id} onClick={() => tweaks.setTweak('accent', id)}
              style={{ width: 32, height: 32, borderRadius: '50%', background: hex, cursor: 'pointer',
                border: '2px solid ' + (tweaks.accent === id ? 'var(--ink)' : 'transparent'),
                boxShadow: tweaks.accent === id ? '0 0 0 2px var(--paper), 0 0 0 4px var(--ink)' : 'none' }} />
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta)', margin: '2px 0 8px' }}>Header</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[['plain','Light'],['accent','Accent']].map(([id,l]) => (
            <button key={id} onClick={() => tweaks.setTweak('headtint', id)}
              style={{ flex: 1, padding: '8px 6px', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: tweaks.headtint === id ? 'var(--emerald)' : 'transparent', color: tweaks.headtint === id ? '#fff' : 'var(--fg)',
                border: '1px solid ' + (tweaks.headtint === id ? 'var(--emerald-ink)' : 'var(--border)') }}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta)', margin: '2px 0 8px' }}>Density</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['comfortable','Comfortable'],['compact','Compact']].map(([id,l]) => (
            <button key={id} onClick={() => tweaks.setTweak('density', id)}
              style={{ flex: 1, padding: '8px 6px', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: tweaks.density === id ? 'var(--emerald)' : 'transparent', color: tweaks.density === id ? '#fff' : 'var(--fg)',
                border: '1px solid ' + (tweaks.density === id ? 'var(--emerald-ink)' : 'var(--border)') }}>{l}</button>
          ))}
        </div>
      </TweakSection>
      <TweakSection label="Account persona"
        description="Switch between two trade accounts to see different orders, credit lines, and shipping setups.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.values(PERSONAS).map(p => (
            <button key={p.id}
                    onClick={() => tweaks.setTweak('persona', p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px',
                      background: tweaks.persona === p.id ? 'var(--paper-2)' : 'transparent',
                      border: `1px solid ${tweaks.persona === p.id ? 'var(--ink)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'all 120ms',
                    }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: tweaks.persona === p.id ? 'var(--emerald)' : 'var(--ink-3)',
                color: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-serif)',
                flex: '0 0 36px',
              }}>{p.initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
                  {p.company}
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-meta)' }}>
                  {p.location} · {p.tier}
                </div>
              </div>
            </button>
          ))}
        </div>
      </TweakSection>
    </TweaksPanel>
  );
}

// One-time splash pop-up shown right after sign-in — admin uploads the image
// (new categories / offers / discounts). Must be dismissed before proceeding.
function SplashPopup() {
  // The admin uploads this image (and on/off) via the Sales Admin → Pop-up window.
  let stored = '', isActive = true;
  try { stored = localStorage.getItem('eurostar-splash-image') || ''; isActive = localStorage.getItem('eurostar-splash-active') !== '0'; } catch (e) {}
  const SPLASH_IMG = stored || (window.SPLASH_IMAGE_URL || '');
  const [open, setOpen] = React.useState(() => {
    if (!isActive) return false;
    try { return sessionStorage.getItem('eurostar-splash-seen') !== '1'; } catch (e) { return true; }
  });
  if (!open) return null;
  const close = () => {
    try { sessionStorage.setItem('eurostar-splash-seen', '1'); } catch (e) {}
    setOpen(false);
  };
  return (
    <div onClick={close} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(21,19,15,0.74)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', width: 'min(560px, 96vw)', maxHeight: '88vh',
        background: 'var(--surface)', borderRadius: 'var(--r-xl)', overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <button onClick={close} aria-label="Close" style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(21,19,15,0.55)', color: '#fff', fontSize: 20, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>

        {SPLASH_IMG ? (
          <img src={SPLASH_IMG} alt="What's new at Eurostar" style={{ width: '100%', display: 'block', maxHeight: '78vh', objectFit: 'contain', background: 'var(--paper-2)' }} />
        ) : (
          // Styled placeholder — replaced by the admin-uploaded image.
          <div style={{
            aspectRatio: '4 / 5', background: 'linear-gradient(150deg, #0E5C4A 0%, #0A3F33 100%)',
            color: 'var(--paper)', padding: '44px 36px', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,231,196,0.85)', fontWeight: 600, marginBottom: 16 }}>What's new</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 38, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 18 }}>
              New arrivals,<br /><em style={{ color: '#F5E7C4' }}>fresh offers</em> &amp; deals
            </div>
            <p style={{ fontSize: 15, color: 'rgba(253,250,242,0.78)', lineHeight: 1.55, margin: '0 auto', maxWidth: '34ch' }}>
              New categories added · seasonal discounts · limited offers. The admin uploads this banner from the Sales Admin panel.
            </p>
            <div style={{ marginTop: 28 }}>
              <button onClick={close} style={{
                padding: '13px 26px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
                background: 'var(--paper)', color: 'var(--ink)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
              }}>Enter the store</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OfflineBar({ isOnline, queued, onSync }) {
  if (isOnline && queued === 0) return null;
  const offline = !isOnline;
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 60,
      background: offline ? '#3A2E12' : 'var(--emerald, #0E5C4A)',
      color: '#FDFAF2', padding: '9px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      fontSize: 13.5, flexWrap: 'wrap',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: offline ? '#E8B23A' : '#7BE0A8', display: 'inline-block' }}></span>
        {offline
          ? <span><strong>You're offline.</strong> Orders are saved on this device and sent automatically when the connection returns.</span>
          : <span><strong>Back online.</strong> {queued} order{queued > 1 ? 's' : ''} waiting to sync.</span>}
      </span>
      {queued > 0 &&
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 99, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>{queued} queued</span>
        {!offline && <button onClick={onSync} style={{ background: '#FDFAF2', color: 'var(--emerald,#0E5C4A)', border: 'none', borderRadius: 'var(--r-sm)', padding: '5px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sync now</button>}
      </span>}
    </div>
  );
}

function Toast({ toast, onDismiss, onView }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 100,
      background: 'var(--ink)', color: 'var(--paper)',
      borderRadius: 'var(--r-lg)',
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: 'var(--shadow-lg)',
      animation: 'slideUp 240ms cubic-bezier(0.2, 0.7, 0.3, 1)',
      maxWidth: 380,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--emerald)', color: 'var(--paper)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flex: '0 0 36px',
      }}>
        <IconCheck size={20} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{toast.kind === 'sync' ? 'Back online — synced' : 'Added to order'}</div>
        <div style={{ fontSize: 12, color: 'rgba(253, 250, 242, 0.7)' }}>
          {toast.kind === 'sync'
            ? `${toast.count} queued order${toast.count > 1 ? 's' : ''} sent to the office`
            : `${(toast.qty || 0).toLocaleString('en-IN')} × ${toast.name}`}
        </div>
      </div>
      {toast.kind !== 'sync' &&
      <button onClick={onView}
              style={{
                background: 'transparent', border: '1px solid rgba(253, 250, 242, 0.3)',
                color: 'var(--paper)', borderRadius: 'var(--r-sm)',
                padding: '6px 12px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>View cart</button>}
      <button onClick={onDismiss}
              style={{
                background: 'transparent', border: 'none', color: 'rgba(253, 250, 242, 0.5)',
                cursor: 'pointer', padding: 4, display: 'flex',
              }}>
        <IconX size={16} />
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '32px 28px',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
        alignItems: 'flex-end',
      }}>
        <div>
          <EurostarLogo size={18} />
          <div style={{ fontSize: 12, color: 'var(--fg-meta)', marginTop: 10, maxWidth: 42 + 'ch', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--fg-muted)', fontWeight: 600 }}>Eurostar Technologies Inc.</strong> · Estd 1980<br/>
            <span style={{ display: 'inline-block', marginTop: 6 }}>
              Authorised Distributor for Asia-Pacific Region:<br/>
              Ganesh Jewellery I Pvt Ltd · Mumbai, Jaipur
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-meta)', textAlign: 'right' }}>
          Trade desk · +91 98765 43210 · info@eurostar.com<br/>
          Mon–Sat 10:00–20:00 IST
        </div>
      </div>
      <ViewModeToggle />
    </footer>
  );
}

function ViewModeToggle() {
  const [desktop, setDesktop] = React.useState(
    typeof window !== 'undefined' && window.__isDesktopMode && window.__isDesktopMode()
  );
  const toggle = () => {
    const next = desktop ? 'mobile' : 'desktop';
    if (window.__setViewMode) window.__setViewMode(next);
    setDesktop(!desktop);
    window.scrollTo(0, 0);
  };
  return (
    <div className={`view-mode-toggle ${desktop ? 'is-desktop' : ''}`}>
      <button type="button" onClick={toggle}>
        {desktop ? '← Back to mobile view' : 'View Desktop mode'}
      </button>
    </div>
  );
}

function ProfileScreen({ persona, setRoute }) {
  const [tab, setTab] = React.useState('details');
  const lbl = (t) => <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-meta)', marginBottom: 6 }}>{t}</div>;
  const inp = { width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14, fontFamily: 'inherit', color: 'var(--fg)', outline: 'none' };
  const isCredit = ['15','30','45','60'].includes(String(persona.terms));
  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <div className="page-head">
        <div>
          <div className="crumb">My account</div>
          <h1>{persona.company}</h1>
          <p>Account {persona.code} · {persona.location}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setRoute({ name: 'home' })}><IconArrowLeft size={16} /> Back</button>
      </div>

      <div className="tabs-row" style={{ marginBottom: 22 }}>
        {[['details', 'Business details'], ['address', 'Addresses'], ['security', 'Security']].map(([id, t]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{t}</button>
        ))}
      </div>

      {tab === 'details' &&
      <div className="card card-pad">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <label>{lbl('Firm / company')}<input style={inp} defaultValue={persona.company} /></label>
          <label>{lbl('Customer code')}<input style={{ ...inp, background: 'var(--paper-2)', color: 'var(--fg-meta)' }} value={persona.code} readOnly /></label>
          <label>{lbl('Contact person')}<input style={inp} defaultValue={persona.contact} /></label>
          <label>{lbl('Mobile')}<input style={inp} defaultValue={persona.phone} /></label>
          <label>{lbl('Email')}<input style={inp} defaultValue={persona.email} /></label>
          <label>{lbl('City')}<input style={inp} defaultValue={persona.location} /></label>
          <label>{lbl('GST / PAN')}<input style={inp} defaultValue={persona.gst || ''} placeholder="GSTIN / PAN" /></label>
          <label>{lbl('Payment terms')}<input style={{ ...inp, background: 'var(--paper-2)', color: 'var(--fg-meta)' }} value={isCredit ? persona.terms + ' days credit' : 'Cash'} readOnly /></label>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-meta)', marginTop: 14 }}>Payment terms are set by Eurostar. Contact your rep to request credit terms.</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><button className="btn btn-accent">Save changes</button></div>
      </div>}

      {tab === 'address' &&
      <div className="card card-pad">
        <h3 className="od-section" style={{ marginTop: 0 }}>Delivery address</h3>
        <label style={{ display: 'block', marginBottom: 14 }}>{lbl('Shipping address')}<textarea rows="3" style={{ ...inp, resize: 'vertical' }} defaultValue={persona.location} /></label>
        <h3 className="od-section">Billing address</h3>
        <label style={{ display: 'block', marginBottom: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-muted)' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--emerald)' }} /> Same as shipping address
          </span>
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><button className="btn btn-accent">Save addresses</button></div>
      </div>}

      {tab === 'security' &&
      <div className="card card-pad">
        <h3 className="od-section" style={{ marginTop: 0 }}>Change password</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, maxWidth: 380 }}>
          <label>{lbl('Current password')}<input type="password" style={inp} placeholder="••••••••" /></label>
          <label>{lbl('New password')}<input type="password" style={inp} placeholder="At least 8 characters" /></label>
          <label>{lbl('Confirm new password')}<input type="password" style={inp} placeholder="Re-enter new password" /></label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><button className="btn btn-accent">Update password</button></div>
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--divider)' }}>
          <button className="btn btn-secondary" onClick={() => setRoute({ name: 'home' })}>Sign out</button>
        </div>
      </div>}
    </div>
  );
}

function FranchiseScreen({ setRoute }) {
  const [submitted, setSubmitted] = React.useState(false);
  const fieldLabel = (txt, req) => (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--fg-meta)', marginBottom: 6 }}>
      {txt}{req && <span style={{ color: 'var(--ruby)', marginLeft: 3 }}>*</span>}
    </div>
  );
  const inputStyle = {
    width: '100%', padding: '10px 12px', background: 'var(--surface-2)',
    border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14,
    fontFamily: 'inherit', color: 'var(--fg)', outline: 'none',
  };

  if (submitted) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <div className="card card-pad" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            background: 'var(--emerald)', color: 'var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
                       letterSpacing: '-0.02em', margin: '0 0 10px' }}>Application received</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15, margin: '0 0 24px' }}>
            Thank you for your interest in a Eurostar franchise. Our partnerships team will
            review your application and reach out within 3 business days.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setRoute({ name: 'home' })}>Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      {/* Hero */}
      <div className="hero" style={{ marginBottom: 32 }}>
        <div className="hero-eyebrow">Partner with Eurostar</div>
        <h1>Open a <em>Eurostar</em> franchise.</h1>
        <p>Bring 40 years of gemstone heritage to your city. Stock moissanite, lab-grown gems,
           cubic zirconia, pearls and more — backed by our supply, pricing and training.</p>
        <div className="hero-stats">
          <div><strong>40+</strong>Years in the trade</div>
          <div><strong>20+</strong>Product categories</div>
          <div><strong>3</strong>Distribution hubs</div>
        </div>
      </div>

      {/* Why */}
      <div className="cat-grid" style={{ marginBottom: 36 }}>
        {[
          ['Ready inventory', 'Full access to 20+ calibrated categories, shipped from Mumbai, Jaipur & Hong Kong.'],
          ['Protected territory', 'Exclusive area rights so you grow without internal competition.'],
          ['Training & support', 'Product, grading and sales training via our LMS, plus a dedicated rep.'],
          ['Trade pricing', 'Franchise pricing tiers and credit terms to protect your margins.'],
        ].map(([t, d]) => (
          <div key={t} className="card card-pad">
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="card card-pad" style={{ padding: 28 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 24, marginBottom: 4 }}>Franchise enquiry</div>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: '0 0 22px' }}>Tell us about yourself and we'll get in touch.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <label>{fieldLabel('Your name', true)}<input style={inputStyle} placeholder="Full name" /></label>
          <label>{fieldLabel('Firm / company', true)}<input style={inputStyle} placeholder="Business name (if any)" /></label>
          <label>{fieldLabel('City', true)}<input style={inputStyle} placeholder="Proposed city / area" /></label>
          <label>{fieldLabel('Mobile number', true)}<input style={inputStyle} type="tel" placeholder="+91 …" /></label>
          <label>{fieldLabel('Investment capacity')}<input style={inputStyle} placeholder="e.g. ₹10–25 lakh" /></label>
          <label>{fieldLabel('Existing jewellery trade?')}
            <select style={inputStyle}><option>Yes — established</option><option>Yes — small/new</option><option>No — new to trade</option></select>
          </label>
          <label>{fieldLabel('Geolocation of proposed store')}<input style={inputStyle} placeholder="Map link / area landmark" /></label>
          <label>{fieldLabel('Area of proposed store')}<input style={inputStyle} placeholder="Sq. ft (minimum 100 sq feet)" /></label>
          <label>{fieldLabel('Which floor?')}
            <select style={inputStyle}><option>Ground floor</option><option>First floor</option><option>Upper floor</option><option>Basement</option></select>
          </label>
          <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: 'var(--fg-muted)', background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginTop: -2 }}>
            Most preferred: a store in the jewellery market on the ground floor, minimum 100 sq feet.
          </div>
          <label style={{ gridColumn: '1 / -1' }}>{fieldLabel('Tell us about your plans')}
            <textarea rows="3" style={{ ...inputStyle, resize: 'vertical' }} placeholder="Retail space, target market, timeline…"></textarea>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-meta)', marginRight: 'auto' }}><span style={{ color: 'var(--ruby)' }}>*</span> required fields</span>
          <button className="btn btn-secondary" onClick={() => setRoute({ name: 'home' })}>Cancel</button>
          <button className="btn btn-accent btn-lg" onClick={() => setSubmitted(true)}>Submit application</button>
        </div>
      </div>
    </div>
  );
}

function RfqStub({ setRoute }) {
  const [imgPreview, setImgPreview] = React.useState(null);
  const [imgName, setImgName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const fileRef = React.useRef(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setImgName(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  if (submitted) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <div className="card card-pad" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            background: 'var(--emerald)', color: 'var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconCheck size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
                       letterSpacing: '-0.02em', margin: '0 0 10px' }}>RFQ submitted</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15, margin: '0 0 24px' }}>
            Our trade desk has received your enquiry and will respond within 1 business day,
            on WhatsApp or by phone.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setRoute({ name: 'home' })}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const fieldLabel = (txt, req) => (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--fg-meta)', marginBottom: 6 }}>
      {txt}{req && <span style={{ color: 'var(--ruby)', marginLeft: 3 }}>*</span>}
    </div>
  );
  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)', fontSize: 14, fontFamily: 'inherit',
    color: 'var(--fg)', outline: 'none',
  };

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <div className="crumb">RFQ Enquiry</div>
          <h1>Request a custom quote</h1>
          <p>Tell us what you need — custom calibrations, non-stock colours, large lots.
             Attach a reference photo and our trade desk responds within 1 business day.</p>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', marginBottom: 16,
        background: 'var(--amber-soft)', border: '1px solid #E6CC7F',
        borderRadius: 'var(--r-md)',
      }}>
        <IconShield size={20} stroke="#7A5214" />
        <div style={{ fontSize: 13, color: '#7A5214' }}>
          <strong style={{ fontWeight: 700 }}>Minimum order value ₹10,000.</strong>{' '}
          RFQs below this value can't be processed — please combine items to meet the minimum.
        </div>
      </div>

      <div className="card card-pad" style={{ padding: 28 }}>
        {/* Product details */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--fg-meta)', marginBottom: 14 }}>
          Product details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <label style={{ gridColumn: '1 / -1' }}>
            {fieldLabel('Product name', true)}
            <input style={inputStyle} placeholder="e.g. Moissanite DEF Round, Cabochon Ruby…" />
          </label>
          <label>
            {fieldLabel('Size')}
            <input style={inputStyle} placeholder="e.g. 3.00 mm / 7×5 mm" />
          </label>
          <label>
            {fieldLabel('Weight (grams)')}
            <input style={inputStyle} type="number" inputMode="decimal" placeholder="e.g. 25" />
          </label>
          <label>
            {fieldLabel('Quality')}
            <input style={inputStyle} placeholder="e.g. VVS DEF / AAA / AAAAA" />
          </label>
          <label>
            {fieldLabel('Quantity required', true)}
            <input style={inputStyle} placeholder="e.g. 500 pcs / 50 ct / 10 packets" />
          </label>
        </div>

        {/* Image upload */}
        <div style={{ marginTop: 20 }}>
          {fieldLabel('Reference image')}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          {!imgPreview ? (
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()}
              style={{
                width: '100%', padding: '28px 16px',
                background: 'var(--surface-2)',
                border: '1.5px dashed var(--border-strong)',
                borderRadius: 'var(--r-md)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                color: 'var(--fg-muted)', fontFamily: 'inherit',
              }}>
              <IconDownload size={26} style={{ transform: 'rotate(180deg)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Upload a photo</span>
              <span style={{ fontSize: 12 }}>PNG or JPG · drag a reference image or click to browse</span>
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: 14, background: 'var(--surface-2)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            }}>
              <img src={imgPreview} alt="Reference"
                   style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--r-sm)',
                            border: '1px solid var(--border)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imgName}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-meta)', marginTop: 2 }}>Attached</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setImgPreview(null); setImgName(''); if (fileRef.current) fileRef.current.value = ''; }}>
                <IconX size={14} /> Remove
              </button>
            </div>
          )}
        </div>

        {/* Special request */}
        <label style={{ display: 'block', marginTop: 20 }}>
          {fieldLabel('Special request')}
          <textarea rows="3" style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Matched pairs, certificate requirements, calibration tolerance, delivery preferences…" />
        </label>

        {/* Contact */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--fg-meta)', margin: '26px 0 14px',
                      paddingTop: 22, borderTop: '1px solid var(--divider)' }}>
          Your contact
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <label>
            {fieldLabel('Your name', true)}
            <input style={inputStyle} placeholder="Full name" />
          </label>
          <label>
            {fieldLabel('Contact number', true)}
            <input style={inputStyle} type="tel" placeholder="+91 / +971 …" />
          </label>
          <label>
            {fieldLabel('City', true)}
            <input style={inputStyle} placeholder="e.g. Surat, Mumbai, Dubai" />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-meta)', marginRight: 'auto' }}>
            <span style={{ color: 'var(--ruby)' }}>*</span> required fields
          </span>
          <button className="btn btn-secondary" onClick={() => setRoute({ name: 'home' })}>Cancel</button>
          <button className="btn btn-accent btn-lg" onClick={() => setSubmitted(true)}>Submit RFQ</button>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Wait for catalog-sync.jsx to pull the live catalogue before the first render,
// so the shop paints with the real categories/prices rather than the built-in
// copy and then flickering. The promise never rejects — if the API is down it
// resolves anyway and we render with the built-in data.
(window.EUROSTAR_CATALOG_READY || Promise.resolve()).then(function () {
  root.render(<App />);
});

// Pre-populated cart so the user can immediately see a populated cart
function sampleCart() {
  const moi = findProduct('EUR-MOI-0107');
  const lab = findProduct('EUR-LAB-0518');
  const cz  = findProduct('EUR-CZ-0301');
  const mkLine = (product, size, ct, shape = product.shape, quality = product.clarity) => {
    const unit = sizeUnitPrice(product, size);
    const perCt = sizePerCtPrice(product, size);
    return {
      pid: product.id, name: product.name,
      shape, size, quality,
      ct,
      qty: Math.round(ct * pcsPerCt(size)),
      unitPrice: unit,
      perCtPrice: perCt,
      lineTotal: ct * perCt,
      tone: product.tone,
      addedAt: Date.now() + Math.random(),
    };
  };
  return [
    mkLine(moi, '1.00 mm', 5,  'round', 'VVS · DEF'),
    mkLine(moi, '1.50 mm', 8,  'round', 'VVS · DEF'),
    mkLine(moi, '2.00 mm', 10, 'round', 'VVS · DEF'),
    mkLine(lab, '5.00 mm', 6,  'oval',  'AAA'),
    mkLine(lab, '6.00 mm', 4,  'oval',  'AAA'),
    mkLine(cz,  '3.00 mm', 25, 'round', 'AAAAA · DEF'),
  ];
}
