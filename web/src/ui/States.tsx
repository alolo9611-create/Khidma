import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

export function Empty({ icon, title, text, action, heading }: { icon: IconName; title: string; text?: ReactNode; action?: ReactNode; heading?: boolean }) {
  return (
    <div className="k-card k-empty">
      <span className="k-empty-icon"><Icon name={icon} /></span>
      {heading ? <h2 className="k-h2">{title}</h2> : <b>{title}</b>}
      {text && <span className="k-small k-muted">{text}</span>}
      {action}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="k-card k-card-pad" aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: rows }, (_, i) => <span key={i} className="k-skel" style={{ width: `${92 - (i % 3) * 7}%` }} />)}
    </div>
  );
}

export function LoadError({ what, onRetry }: { what: string; onRetry(): void }) {
  return <Empty icon="alertCircle" title={`We couldn't load ${what}`} text="Check your connection and try again." action={<button className="k-btn k-btn-secondary k-btn-sm" type="button" onClick={onRetry}>Try again</button>} />;
}

/** S-14 access denied (403). */
export function Forbidden({ home, homeLabel }: { home: string; homeLabel: string }) {
  return (
    <main className="k-main is-tight" style={{ paddingTop: 64 }}>
      <Empty heading icon="lock" title="You don't have access to this page" text="It belongs to another applicant or another department." action={<Link className="k-btn k-btn-secondary k-btn-sm" to={home}>{homeLabel}</Link>} />
    </main>
  );
}

/** S-14 not found (404). */
export function NotFound() {
  return (
    <main className="k-main is-tight" style={{ paddingTop: 64 }}>
      <Empty heading icon="search" title="We can't find that page" text="The link may be wrong or the request may no longer exist." action={<Link className="k-btn k-btn-secondary k-btn-sm" to="/catalog">Go to home</Link>} />
    </main>
  );
}

/** INVALID_TRANSITION (409) copy from HANDOFF §6. */
export function ChangedAlert({ onReload }: { onReload(): void }) {
  return (
    <div className="k-alert k-alert-warn" role="alert">
      <Icon name="alertTriangle" />
      <div className="k-alert-body">
        <b>This request has changed</b>
        <span className="k-small">It was updated while you were viewing it, so your action wasn't applied. Reload to see the latest status.</span>
        <span><button className="k-btn k-btn-secondary k-btn-sm" type="button" onClick={onReload}>Reload</button></span>
      </div>
    </div>
  );
}
