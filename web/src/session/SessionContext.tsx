import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMe, type SessionUser } from '../api/auth';
import { SESSION_EXPIRED } from '../api/http';

interface SessionValue {
  user: SessionUser | null;
  loading: boolean;
  setUser(u: SessionUser | null): void;
}

const SessionContext = createContext<SessionValue | null>(null);

// Restores the user from /me once per mount. No redirects here: guards belong to F-02.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMe()
      .then((u) => { if (active) setUser(u); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const expired = () => setUser(null); // RequireRole then sends the user to /login
    window.addEventListener(SESSION_EXPIRED, expired);
    return () => window.removeEventListener(SESSION_EXPIRED, expired);
  }, []);

  if (loading) return <p>Loading…</p>;
  return <SessionContext.Provider value={{ user, loading, setUser }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
