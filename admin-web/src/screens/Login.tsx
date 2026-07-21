import { useState } from 'react';
import { adminApi, setToken, setRefreshToken } from '../lib/api';

// Ported from the original "Eurostar Admin.html" login so the panel looks like
// the design that was signed off. Only the submit is different: it awaits the
// server and shows the real error instead of a canned one.
export function Login({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await adminApi.login(username.trim(), password, remember);
      setToken(r.accessToken);
      // Keep the refresh token so an expired 15-minute access token renews
      // itself instead of bouncing the operator back here on the next refresh.
      setRefreshToken(r.refreshToken || '');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lg">
      <div className="lg-left">
        <div className="lgl-wordmark">eurostar</div>
        <div className="lgl-eyebrow">Sales App Admin · Mumbai &amp; Jaipur</div>
        <h1>
          Control the
          <br />
          <em>catalog</em>, cleanly.
        </h1>
        <p className="lgl-sub">
          Categories, grades, pricing, inventory and bulk uploads — the control room behind the Eurostar Sales App.
        </p>
        <div className="lgl-item">
          <div className="ic">💎</div>
          <div>
            <b>Catalog &amp; pricing</b>
            <span>Grades, colours, shapes and sizes</span>
          </div>
        </div>
        <div className="lgl-item">
          <div className="ic">📦</div>
          <div>
            <b>Inventory &amp; sold-out</b>
            <span>Per-SKU availability control</span>
          </div>
        </div>
        <div className="lgl-item">
          <div className="ic">⬆️</div>
          <div>
            <b>Bulk upload</b>
            <span>CSV / Excel product import</span>
          </div>
        </div>
      </div>

      <div className="lg-right">
        <form className="lg-form" onSubmit={submit} autoComplete="on">
          <span className="lg-badge">✦ Administrator</span>
          <h2>Welcome back</h2>
          <p className="lgsub">Sign in with your Admin credentials.</p>

          {error && <p className="lgerr">{error}</p>}

          <div className="lgfield">
            <label htmlFor="lg-user">Username</label>
            <input
              id="lg-user"
              type="text"
              autoComplete="username"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="lgfield">
            <label htmlFor="lg-pass">Password</label>
            <input
              id="lg-pass"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label className="lgrow">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Keep me signed in on this device</span>
          </label>

          <button className="lgbtn" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="lghint">Eurostar Technologies · Internal use only</p>
        </form>
      </div>
    </div>
  );
}
