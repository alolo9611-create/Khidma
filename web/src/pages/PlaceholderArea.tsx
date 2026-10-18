import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { useSession } from '../session/SessionContext';

export function PlaceholderArea({ heading }: { heading: string }) {
  const { user, setUser } = useSession();
  const navigate = useNavigate();

  async function onSignOut() {
    await logout();
    setUser(null);
    navigate('/login');
  }

  return (
    <main>
      <h1>{heading}</h1>
      {user && <p>Signed in as {user.name}</p>}
      <button type="button" onClick={onSignOut}>Sign out</button>
    </main>
  );
}
