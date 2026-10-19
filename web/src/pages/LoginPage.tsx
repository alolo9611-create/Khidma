import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiProblem, login } from '../api/auth';
import { roleHome } from '../session/roleHome';
import { useSession } from '../session/SessionContext';
import { Icon } from '../ui/Icon';

// S-01 (Story 28). Error text is the API's approved title (Q-15). No register, reset or credential hints (D-7).
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { user, setUser } = useSession();
  const navigate = useNavigate();

  if (user) return <Navigate to={roleHome(user.role)} replace />; // PQ-08

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const signedIn = await login(email, password);
      setUser(signedIn);
      navigate(roleHome(signedIn.role));
    } catch (err) {
      if (err instanceof ApiProblem) setError(err.message);
      else setError('Something went wrong. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="k-main is-tight" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 56 }}>
      <section className="k-card k-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="k-stack-sm">
          <h1 className="k-h1">Sign in to Khidma</h1>
          <p className="k-muted">For applicants and GACS staff. Use the account GACS provided to you.</p>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          {error && (
            <div className="k-alert k-alert-error" role="alert"><Icon name="alertCircle" /><div className="k-alert-body"><span className="k-small"><b>{error}</b></span></div></div>
          )}
          <div className="k-field">
            <label className="k-label" htmlFor="email">Email</label>
            <input className="k-input" id="email" type="email" autoComplete="username" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="k-field">
            <label className="k-label" htmlFor="pw">Password</label>
            <input className="k-input" id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className={`k-btn k-btn-primary k-btn-block${busy ? ' is-loading' : ''}`} type="submit" aria-busy={busy}>
            {busy && <span className="k-spin" />}{busy ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="k-row" style={{ gap: 8, alignItems: 'flex-start' }}><Icon name="info" small /><span className="k-small k-muted">Contact GACS if you can't sign in.</span></div>
        </form>
      </section>
      <div className="k-row" style={{ justifyContent: 'center', gap: 20 }}><Link className="k-small" to="/catalog">Browse services</Link><Link className="k-small" to="/verify">Verify a certificate</Link></div>
    </main>
  );
}
