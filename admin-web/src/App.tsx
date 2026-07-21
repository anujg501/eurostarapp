import { useCallback, useEffect, useState } from 'react';
import { getToken, setToken, setRefreshToken } from './lib/api';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { Catalog } from './screens/Catalog';
import { Media } from './screens/Media';
import { Settings } from './screens/Settings';
import { Content } from './screens/Content';
import { Users } from './screens/Users';
import { Marketing } from './screens/Marketing';
import { AddCategory } from './screens/AddCategory';
import { BulkUploadPage } from './screens/BulkUpload';
import { TweaksPanel } from './TweaksPanel';

type ScreenId =
  | 'dashboard'
  | 'catalog'
  | 'newcat'
  | 'bulk'
  | 'media'
  | 'homethumbs'
  | 'splash'
  | 'repbroadcast'
  | 'users'
  | 'content'
  | 'settings';

// The original panel's sidebar: one flat list under a single group label.
const NAV: { id: ScreenId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'newcat', label: '＋ Add category' },
  { id: 'bulk', label: 'Bulk upload' },
  { id: 'media', label: 'Product images' },
  { id: 'homethumbs', label: 'Home thumbnails' },
  { id: 'splash', label: 'Pop-up window' },
  { id: 'repbroadcast', label: 'Rep broadcast' },
  { id: 'users', label: 'Users & access' },
  { id: 'content', label: 'Content' },
  { id: 'settings', label: 'Settings' },
];

const TITLES: Record<ScreenId, string> = {
  dashboard: 'Dashboard',
  catalog: 'Catalog',
  newcat: '＋ Add category',
  bulk: 'Bulk upload',
  media: 'Product images',
  homethumbs: 'Home thumbnails',
  splash: 'Pop-up window',
  repbroadcast: 'Rep broadcast',
  users: 'Users & access',
  content: 'Content',
  settings: 'Settings',
};

export function App() {
  const [signedIn, setSignedIn] = useState(() => !!getToken());
  const [screen, setScreenState] = useState<ScreenId>('dashboard');

  // Browser Back/Forward. This panel navigates through React state, and it is
  // served as a single page whose path (/admin) must stay put — so the page is
  // carried in history.state and the URL is left clean (no "#"). pushState
  // still creates a real history entry even with an unchanged URL.
  //
  // Entries also carry adminAuth, which marks them as created while signed in.
  // Without it Back cannot tell a panel screen from the login gate that was
  // rendered at this same URL before sign-in, and walking back far enough drops
  // the operator onto a login page mid-session (the storefront solves the same
  // problem by replacing the login entry outright — the panel cannot, because
  // its gate and its screens share one URL).
  type HistState = { adminScreen?: ScreenId; adminAuth?: boolean } | null;
  const cleanUrl = () => window.location.href.split('#')[0];
  const stamp = useCallback((next: ScreenId, mode: 'push' | 'replace') => {
    try {
      const state = { adminScreen: next, adminAuth: !!getToken() };
      window.history[mode === 'push' ? 'pushState' : 'replaceState'](state, '', cleanUrl());
    } catch {
      /* history unavailable — navigation still works, just without Back */
    }
  }, []);

  const setScreen = useCallback(
    (next: ScreenId) => {
      stamp(next, 'push');
      setScreenState(next);
    },
    [stamp]
  );

  useEffect(() => {
    // Seed the first entry (and strip any stray "#" a previous build left).
    stamp('dashboard', 'replace');

    const onPop = (e: PopStateEvent) => {
      const st = e.state as HistState;
      // getToken(), not the signedIn state: this listener is registered once and
      // would otherwise close over the value from first render.
      if (getToken() && !st?.adminAuth) {
        // Popped onto an entry from before sign-in. Signing in did not navigate,
        // so that entry still renders the login gate — push the panel back on
        // top instead of letting a live session land there.
        stamp('dashboard', 'push');
        setScreenState('dashboard');
        return;
      }
      setScreenState(st?.adminScreen && st.adminScreen in TITLES ? st.adminScreen : 'dashboard');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [stamp]);

  // api.ts clears the token and fires this on a 401/403, so an expired session
  // returns to the login gate instead of leaving a blank screen.
  const onAuthLost = useCallback(() => {
    setSignedIn(false);
    stamp('dashboard', 'replace'); // token already cleared, so this drops adminAuth
  }, [stamp]);
  useEffect(() => {
    window.addEventListener('eurostar-auth-lost', onAuthLost);
    return () => window.removeEventListener('eurostar-auth-lost', onAuthLost);
  }, [onAuthLost]);

  if (!signedIn) {
    return (
      <Login
        onDone={() => {
          setSignedIn(true);
          setScreenState('dashboard');
          // Re-stamp the entry the gate was rendered on: it now holds the
          // dashboard, so Back from it is a pop out of a live session and the
          // popstate guard above turns it back.
          stamp('dashboard', 'replace');
        }}
      />
    );
  }

  const signOut = () => {
    setToken('');
    setRefreshToken(''); // otherwise the next request would silently renew the session
    setSignedIn(false);
    // Token is gone, so this clears adminAuth — Back leaves the panel normally
    // again instead of being held by the guard.
    stamp('dashboard', 'replace');
  };

  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <div className="ad-brand">
          {/* The jpeg has a white background, so the mark stays visible on the
              dark sidebar — the transparent png disappears against it. */}
          <img src="/assets/eurostar-logo.jpeg" alt="Eurostar" />
          <div>
            <b>Eurostar</b>
            <small>Admin</small>
          </div>
        </div>

        <nav className="ad-nav">
          <div className="ad-nav-label">Sales App Admin</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`ad-nav-item ${screen === n.id ? 'active' : ''}`}
              onClick={() => setScreen(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ad-side-foot">
          <a className="ad-applink" href="/site" target="_blank" rel="noreferrer">
            ↗ Open Sales App
          </a>
          <button
            className="ad-applink"
            onClick={signOut}
            style={{ width: '100%', border: 'none', cursor: 'pointer', marginTop: 6 }}
          >
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
        {/* "＋ Add category" is its own full-page questionnaire, like the
            original panel. The Catalog's own "＋ Create new category" button
            still opens the client's dialog. */}
        {screen === 'newcat' && <AddCategory key="newcat" onDone={() => setScreen('catalog')} />}
        {screen === 'bulk' && <BulkUploadPage />}
        {screen === 'media' && <Media key="products" initialTab="products" />}
        {screen === 'homethumbs' && <Media key="thumbs" initialTab="thumbs" />}
        {screen === 'splash' && <Marketing only="splash" />}
        {screen === 'repbroadcast' && <Marketing only="broadcast" />}
        {screen === 'users' && <Users />}
        {screen === 'content' && <Content />}
        {screen === 'settings' && <Settings />}
      </main>

      <TweaksPanel />
    </div>
  );
}
