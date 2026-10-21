import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { khidma, type NotificationItem } from '../api/khidma';
import { useSession } from '../session/SessionContext';
import { roleHome } from '../session/roleHome';
import { firstName, fmtShort, initials, ROLE_LABEL } from '../ui/format';
import { Icon } from '../ui/Icon';

interface NavItem { to: string; label: string; end?: boolean }

function useOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOutside(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOutside, active]);
}

/** S-13: bell with unread count and the notifications popover (BR-14). */
function Bell() {
  const [data, setData] = useState<{ unread: number; items: NotificationItem[] }>({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const load = useCallback(() => { khidma.notifications().then(setData).catch(() => {}); }, []);
  useEffect(load, [load, location.pathname]); // refreshed on navigation; no push (F-19)
  useOutside(ref, () => setOpen(false), open);
  async function openItem(n: NotificationItem) {
    setOpen(false);
    await khidma.readNotification(n.id).catch(() => {});
    load();
    navigate(n.link);
  }
  return (
    <div ref={ref}>
      <button className={`k-icon-btn${open ? ' is-open' : ''}`} type="button" aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="bell" />{data.unread > 0 && <span className="k-count">{data.unread}</span>}
      </button>
      {open && (
        <section className="k-pop" aria-label="Notifications">
          <div className="k-pop-head"><h2 className="k-h3">Notifications</h2>{data.unread > 0 && <span className="k-small k-muted">{data.unread} unread</span>}</div>
          {data.items.length === 0 ? (
            <div className="k-empty"><span className="k-empty-icon"><Icon name="bell" /></span><b className="k-small">You're all caught up</b><span className="k-xs k-muted">Updates about your requests will appear here.</span></div>
          ) : (
            <div className="k-pop-list">
              {data.items.map((n) => (
                <a key={n.id} className={`k-notif${n.readAt ? '' : ' is-unread'}`} href={n.link} onClick={(e) => { e.preventDefault(); void openItem(n); }}>
                  <span className="k-notif-dot" /><div><p>{n.message}</p><span className="k-xs k-muted">{fmtShort(n.createdAt)}</span></div>
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function AccountMenu({ onSignOut }: { onSignOut(): void }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  if (!user) return null;
  return (
    <div ref={ref} style={{ position: 'relative' }} className="k-desktop-only">
      <button className="k-user" type="button" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="k-avatar">{initials(user.name)}</span>
        <span className="k-user-meta"><b>{firstName(user.name)}</b><span>{ROLE_LABEL[user.role]}</span></span>
        <Icon name="chevronDown" small />
      </button>
      {open && (
        <div className="k-menu" role="menu">
          <span className="k-small k-muted" style={{ padding: '8px 12px' }}>Signed in as {user.name}</span>
          <button type="button" role="menuitem" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, setUser } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deptName, setDeptName] = useState<string | null>(null);
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!user || user.departmentId === null) { setDeptName(null); return; }
    khidma.services().then((s) => setDeptName(s.find((x) => x.department.id === user.departmentId)?.department.name ?? null)).catch(() => {});
  }, [user]);

  async function signOut() {
    await logout().catch(() => {});
    setUser(null);
    navigate('/login');
  }

  const staff = user && user.role !== 'APPLICANT';
  const nav: NavItem[] = !user
    ? [{ to: '/catalog', label: 'Services' }, { to: '/verify', label: 'Verify a certificate' }]
    : user.role === 'APPLICANT'
      ? [{ to: '/catalog', label: 'Services' }, { to: '/applicant', label: 'My requests' }]
      : user.role === 'REVIEWER'
        ? [{ to: '/staff/review', label: 'Queue' }]
        : [{ to: '/staff/supervisor', label: 'Dashboard', end: true }, { to: '/staff/review', label: 'Queue' }, { to: '/staff/supervisor/services', label: 'Services' }];
  const isActive = (to: string, end?: boolean) => {
    const p = location.pathname;
    if (to === '/applicant') return p === '/applicant' || p.startsWith('/applicant/');
    if (to === '/staff/review') return p.startsWith('/staff/review') || p.startsWith('/staff/requests');
    return end ? p === to : p === to || p.startsWith(to + '/');
  };
  const publicPage = !user || ['/catalog', '/verify'].some((p) => location.pathname.startsWith(p));

  return (
    <div className="k-app">
      <header className="k-top">
        <div className="k-top-inner">
          <Link className="k-brand" to={user ? roleHome(user.role) : '/catalog'}>
            <span className="k-brand-mark">K</span>
            <span>Khidma<span className="k-brand-sub">{staff ? 'Staff workspace' : 'General Authority for Civic Services'}</span></span>
          </Link>
          <nav className="k-nav is-desktop" aria-label="Main">
            {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={() => (isActive(n.to, n.end) ? 'is-active' : '')}>{n.label}</NavLink>)}
          </nav>
          <div className="k-top-actions">
            {staff && deptName && <span className="k-dept">{deptName} department</span>}
            {user ? <><Bell /><AccountMenu onSignOut={signOut} /></> : <Link className="k-btn k-btn-primary k-btn-sm" to="/login">Sign in</Link>}
            <button className="k-icon-btn k-mobile-only" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name={menuOpen ? 'x' : 'menu'} />
            </button>
          </div>
          {menuOpen && (
            <nav className="k-sheet-nav" aria-label="Main">
              {nav.map((n) => <Link key={n.to} to={n.to} className={isActive(n.to, n.end) ? 'is-active' : ''}>{n.label}</Link>)}
              {user && <><hr className="k-divider" style={{ margin: '6px 0' }} /><span style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}><span className="k-avatar">{initials(user.name)}</span><span className="k-small"><b>{firstName(user.name)}</b> · {ROLE_LABEL[user.role]}</span></span><button type="button" onClick={signOut}>Sign out</button></>}
            </nav>
          )}
        </div>
      </header>
      {children}
      {publicPage && (
        <footer className="k-foot">
          <div className="k-foot-inner">
            <span>General Authority for Civic Services · fictional authority for training use</span>
            <span className="k-row k-foot-links" style={{ gap: 16 }}><Link to="/verify">Verify a certificate</Link>{!user && <Link to="/login">Staff sign in</Link>}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
