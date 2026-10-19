import { Link } from 'react-router-dom';
import { khidma } from '../api/khidma';
import { fmtDateTime, initials } from '../ui/format';
import { Icon } from '../ui/Icon';
import { LoadError, Skeleton } from '../ui/States';
import { useLoad } from '../ui/useLoad';

// S-11 (F-18, BR-12): four numbers — open, at risk, overdue, active requests per reviewer. No charts.
export function DashboardPage() {
  const d = useLoad(() => khidma.dashboard(), []);
  if (d.error) return <main className="k-main"><LoadError what="the dashboard" onRetry={d.reload} /></main>;
  if (!d.data) return <main className="k-main"><Skeleton rows={6} /></main>;
  const x = d.data;
  return (
    <main className="k-main">
      <div className="k-page-head">
        <div className="k-stack-sm"><h1 className="k-h1">{x.department.name} dashboard</h1><p className="k-muted">Live counts, computed when you open the page · {fmtDateTime(new Date().toISOString())}</p></div>
        <Link className="k-btn k-btn-secondary" to="/staff/review">Open queue</Link>
      </div>
      <div className="k-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
        <Link className="k-card k-stat" to="/staff/review" style={{ textDecoration: 'none', color: '#14201C' }}><span className="k-stat-label">Open requests</span><span className="k-stat-num">{x.open}</span><span className="k-small k-muted">Submitted, in review or info requested</span></Link>
        <Link className="k-card k-stat" to="/staff/review" style={{ textDecoration: 'none', color: '#14201C' }}><span className="k-stat-label"><span className="k-sla sla-risk"><Icon name="clock" small />At risk</span></span><span className="k-stat-num">{x.atRisk}</span><span className="k-small k-muted">1 working day or less left</span></Link>
        <Link className="k-card k-stat" to="/staff/review" style={{ textDecoration: 'none', color: '#14201C', ...(x.overdue > 0 ? { borderColor: '#F0B8B1', boxShadow: 'inset 0 3px 0 #B42318' } : {}) }}><span className="k-stat-label"><span className="k-sla sla-over"><Icon name="alertTriangle" small />Overdue</span></span><span className="k-stat-num" style={x.overdue > 0 ? { color: '#A3261C' } : undefined}>{x.overdue}</span><span className="k-small k-muted">Past due and not decided</span></Link>
      </div>
      <section className="k-card">
        <div className="k-card-head"><h2 className="k-section-title">Active requests per reviewer</h2><span className="k-small k-muted">Limit {x.reviewers[0]?.limit ?? 10} per reviewer</span></div>
        <div className="k-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {x.reviewers.length === 0 && <span className="k-small k-muted">No reviewers in this department.</span>}
          {x.reviewers.map((r) => {
            const pct = Math.min(100, (r.active / r.limit) * 100);
            return (
              <div className="k-stack-sm" key={r.id}>
                <div className="k-row" style={{ justifyContent: 'space-between' }}><span className="k-row" style={{ gap: 10 }}><span className="k-avatar">{initials(r.name)}</span><b>{r.name}</b></span><span className="k-mono k-strong">{r.active} / {r.limit}</span></div>
                <div className={`k-meter${r.active >= r.limit ? ' is-full' : pct >= 80 ? ' is-high' : ''}`}><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
