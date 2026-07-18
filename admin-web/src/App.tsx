import { useCallback, useEffect, useState } from 'react';
import { getToken, setToken } from './lib/api';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { Catalog } from './screens/Catalog';
import { Media } from './screens/Media';
import { Products } from './screens/Products';
import { Settings } from './screens/Settings';
import { Content } from './screens/Content';
import { Users } from './screens/Users';
import { Marketing } from './screens/Marketing';

type ScreenId = 'dashboard' | 'catalog' | 'products' | 'media' | 'marketing' | 'content' | 'users' | 'settings';

// Grouped the way the original panel's sidebar was.
const NAV: { group: string; items: { id: ScreenId; label: string; icon: string }[] }[] = [
  {
    group: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: '▦' }],
  },
  {
    group: 'Catalogue',
    items: [
      { id: 'catalog', label: 'Categories', icon: '💎' },
      { id: 'products', label: 'Products & pricing', icon: '🏷️' },
      { id: 'media', label: 'Images', icon: '🖼️' },
    ],
  },
  {
    group: 'Storefront',
    items: [
      { id: 'marketing', label: 'Marketing', icon: '📣' },
      { id: 'content', label: 'Content', icon: '📝' },
    ],
  },
  {
    group: 'Admin',
    items: [
      { id: 'users', label: 'Users & access', icon: '👤' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

const TITLES: Record<ScreenId, string> = {
  dashboard: 'Dashboard',
  catalog: 'Catalog',
  products: 'Products & pricing',
  media: 'Images',
  marketing: 'Marketing',
  content: 'Content',
  users: 'Users & access',
  settings: 'Settings',
};

export function App() {
  const [signedIn, setSignedIn] = useState(() => !!getToken());
  const [screen, setScreen] = useState<ScreenId>('dashboard');

  // api.ts clears the token and fires this on a 401/403, so an expired session
  // returns to the login gate instead of leaving a blank screen.
  const onAuthLost = useCallback(() => setSignedIn(false), []);
  useEffect(() => {
    window.addEventListener('eurostar-auth-lost', onAuthLost);
    return () => window.removeEventListener('eurostar-auth-lost', onAuthLost);
  }, [onAuthLost]);

  if (!signedIn) return <Login onDone={() => setSignedIn(true)} />;

  const signOut = () => {
    setToken('');
    setSignedIn(false);
  };

  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <div className="ad-brand">
          <div>
            <b>eurostar</b>
            <small>Sales App Admin</small>
          </div>
        </div>

        <nav className="ad-nav">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="ad-nav-label">{g.group}</div>
              {g.items.map((n) => (
                <button
                  key={n.id}
                  className={`ad-nav-item ${screen === n.id ? 'active' : ''}`}
                  onClick={() => setScreen(n.id)}
                >
                  <span aria-hidden="true">{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="ad-side-foot">
          <button className="ad-applink" onClick={signOut} style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
            ↩ Sign out
          </button>
        </div>
      </aside>

      <main className="ad-main">
        <div className="ad-top">
          <h1>{TITLES[screen]}</h1>
          <span className="ad-pill">Live catalog</span>
        </div>

        {screen === 'dashboard' && <Dashboard onGo={setScreen} />}
        {screen === 'catalog' && <Catalog />}
        {screen === 'media' && <Media />}
        {screen === 'products' && <Products />}
        {screen === 'marketing' && <Marketing />}
        {screen === 'content' && <Content />}
        {screen === 'users' && <Users />}
        {screen === 'settings' && <Settings />}
      </main>
    </div>
  );
}
