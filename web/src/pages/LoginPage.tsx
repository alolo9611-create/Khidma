import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiProblem, login } from '../api/auth';
import { roleHome } from '../session/roleHome';
import { useSession } from '../session/SessionContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useSession();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      setUser(user);
      navigate(roleHome(user.role));
    } catch (err) {
      if (err instanceof ApiProblem) setError(err.message);
      else throw err;
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Sign in</h1>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit">Sign in</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
