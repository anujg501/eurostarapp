import { useEffect, useState } from 'react';
import { adminApi, type NewStaffUser, type StaffRole, type StaffUser } from '../lib/api';

const ROLES: { id: StaffRole; label: string }[] = [
  { id: 'rep', label: 'Sales Rep' },
  { id: 'office', label: 'Back Office' },
  { id: 'admin', label: 'Admin' },
];

const roleLabel = (r: string) => ROLES.find((x) => x.id === r)?.label ?? r;

export function Users() {
  const [users, setUsers] = useState<StaffUser[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [adding, setAdding] = useState(false);
  // The server returns a new password once and never again, so it is held here
  // until the operator dismisses it — losing it means another reset.
  const [reveal, setReveal] = useState<{ username: string; password: string } | null>(null);

  const load = async () => {
    setError('');
    try {
      setUsers(await adminApi.users());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load users.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleActive = async (u: StaffUser) => {
    setBusyId(u.id);
    setError('');
    try {
      const updated = await adminApi.updateUser(u.id, { active: !u.active });
      setUsers((xs) => (xs ?? []).map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the user.');
    } finally {
      setBusyId('');
    }
  };

  const resetPw = async (u: StaffUser) => {
    if (!confirm(`Reset the password for ${u.name}? Their current password stops working immediately.`)) return;
    setBusyId(u.id);
    setError('');
    try {
      const r = await adminApi.resetPassword(u.id);
      setReveal({ username: r.username, password: r.password });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset the password.');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (u: StaffUser) => {
    if (!confirm(`Remove ${u.name} (${u.username})? They will not be able to sign in again.`)) return;
    setBusyId(u.id);
    setError('');
    try {
      await adminApi.deleteUser(u.id);
      setUsers((xs) => (xs ?? []).filter((x) => x.id !== u.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the user.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="ad-body">
      <div className="ad-pagehead ad-head-row">
        <div>
          <h2>Users &amp; access</h2>
          <p className="ad-muted">{users ? `${users.length} staff accounts` : 'Loading…'}</p>
        </div>
        <button className="ad-btn ad-btn-pri" onClick={() => setAdding(true)}>
          ＋ Add user
        </button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {reveal && (
        <div className="ad-reveal">
          <strong>Password for {reveal.username}</strong>
          <code className="ad-code">{reveal.password}</code>
          <p className="ad-hint">
            Copy it now — it cannot be shown again. Send it to them over a channel you trust.
          </p>
          <button className="ad-btn ad-btn-sm" onClick={() => setReveal(null)}>
            Done
          </button>
        </div>
      )}

      {adding && (
        <AddUser
          onCancel={() => setAdding(false)}
          onCreated={(u, password) => {
            setUsers((xs) => [...(xs ?? []), u]);
            setAdding(false);
            if (password) setReveal({ username: u.username, password });
          }}
        />
      )}

      {!users ? (
        <div className="ad-muted">Loading users…</div>
      ) : (
        <div className="ad-card">
          {users.map((u) => (
            <div className="ad-listrow" key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
              <div className="ad-listrow-main">
                <div className="nm">
                  {u.name} {u.isOwner && <span className="ad-tag">OWNER</span>}
                </div>
                <div className="ad-hint">
                  {u.username} · {roleLabel(u.role)} {u.active ? '' : '· disabled'}
                </div>
              </div>
              <div className="ad-row">
                <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busyId === u.id} onClick={() => toggleActive(u)}>
                  {u.active ? 'Disable' : 'Enable'}
                </button>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busyId === u.id} onClick={() => resetPw(u)}>
                  Reset password
                </button>
                {!u.isOwner && (
                  <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busyId === u.id} onClick={() => remove(u)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddUser({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (u: StaffUser, password?: string) => void;
}) {
  const [f, setF] = useState<NewStaffUser>({ role: 'rep', name: '', username: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof NewStaffUser>(k: K, v: NewStaffUser[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    if (!f.name.trim() || !f.username.trim()) {
      setError('Name and username are both required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // Password omitted on purpose: the server generates a strong one and
      // returns it once.
      const created = await adminApi.createUser({
        role: f.role,
        name: f.name.trim(),
        username: f.username.trim(),
        phone: f.phone,
      });
      const { password, ...user } = created;
      onCreated(user as StaffUser, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the user.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-card ad-card-pad">
      <label className="ad-label">
        Full name
        <input className="ad-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Rohit Shah" />
      </label>
      <label className="ad-label">
        Username
        <input className="ad-input" value={f.username} onChange={(e) => set('username', e.target.value)} placeholder="e.g. REP-205" />
        <span className="ad-hint">Letters, numbers, dot, underscore or dash.</span>
      </label>
      <label className="ad-label">
        Phone
        <input className="ad-input" value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="Optional" />
      </label>
      <div className="ad-label">
        Role
        <div className="ad-chips">
          {ROLES.map((r) => (
            <button key={r.id} type="button" className={`ad-chip ${f.role === r.id ? 'sel' : ''}`} onClick={() => set('role', r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-actions">
        <button className="ad-btn ad-btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="ad-btn ad-btn-pri" onClick={submit} disabled={busy}>
          {busy ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </div>
  );
}
