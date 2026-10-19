import { Link } from 'react-router-dom';
import { khidma, type MyRequestRow } from '../api/khidma';
import { StatusBadge } from '../ui/Badges';
import { fmtDate, fmtDayMonth } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Empty, LoadError, Skeleton } from '../ui/States';
import { useLoad } from '../ui/useLoad';

// S-07 (F-09): own requests with status and due date; drafts included (PQ-18).
function nextStep(r: MyRequestRow) {
  switch (r.status) {
    case 'DRAFT': return <Link className="k-btn k-btn-secondary k-btn-sm" to={`/applicant/requests/${r.id}/edit`}>Continue draft</Link>;
    case 'INFO_REQUESTED': return <Link className="k-btn k-btn-primary k-btn-sm" to={`/applicant/requests/${r.id}`}>Respond</Link>;
    case 'APPROVED': return <Link className="k-small k-strong" to={`/applicant/requests/${r.id}`}>View certificate</Link>;
    case 'REJECTED': return <Link className="k-small k-strong" to={`/applicant/requests/${r.id}`}>See reason</Link>;
    case 'WITHDRAWN': return <span className="k-small k-muted">Closed</span>;
    case 'SUBMITTED': return <span className="k-small k-muted">Waiting for a reviewer</span>;
    default: return <span className="k-small k-muted">With the reviewer</span>;
  }
}
const refCell = (r: MyRequestRow) => r.referenceNo
  ? <Link to={r.status === 'DRAFT' ? `/applicant/requests/${r.id}/edit` : `/applicant/requests/${r.id}`}>{r.referenceNo}</Link>
  : <span className="k-small k-muted" style={{ fontFamily: 'var(--f-ui)' }}>No reference yet</span>;
const dueCell = (r: MyRequestRow) => r.status === 'DRAFT' ? <span className="k-muted">Set on submit</span>
  : r.decidedAt ? <span className="k-muted">Decided {fmtDayMonth(r.decidedAt)}</span>
  : r.status === 'WITHDRAWN' ? <span className="k-muted">—</span> : fmtDate(r.dueAt);

export function MyRequestsPage() {
  const list = useLoad(() => khidma.myRequests(), []);
  const waiting = list.data?.filter((r) => r.status === 'INFO_REQUESTED') ?? [];
  return (
    <main className="k-main">
      <div className="k-page-head">
        <div className="k-stack-sm"><h1 className="k-h1">My requests</h1><p className="k-muted">Track every request you have submitted and continue your drafts.</p></div>
        <Link className="k-btn k-btn-primary" to="/catalog"><Icon name="plus" />New request</Link>
      </div>
      {waiting.length > 0 && (
        <div className="k-alert k-alert-warn" style={{ marginBottom: 20, alignItems: 'center' }}>
          <Icon name="alertTriangle" />
          <div className="k-alert-body" style={{ flex: 1 }}><span><b style={{ color: '#7A4300' }}>{waiting.length} request{waiting.length === 1 ? ' needs' : 's need'} your response.</b> A reviewer asked for more information on <span className="k-mono">{waiting.map((w) => w.referenceNo).join(', ')}</span>.</span></div>
          <Link className="k-btn k-btn-secondary k-btn-sm" to={`/applicant/requests/${waiting[0].id}`}>Respond</Link>
        </div>
      )}
      {list.error ? <LoadError what="your requests" onRetry={list.reload} /> : !list.data ? <Skeleton rows={5} /> : list.data.length === 0 ? (
        <Empty icon="fileText" title="No requests yet" text="Choose a service to start your first request." action={<Link className="k-btn k-btn-primary k-btn-sm" to="/catalog">Browse services</Link>} />
      ) : (
        <>
          <div className="k-table-wrap has-cards">
            <table className="k-table">
              <thead><tr><th>Reference</th><th>Service</th><th>Status</th><th>Submitted</th><th>Due date</th><th style={{ textAlign: 'right' }}>Next step</th></tr></thead>
              <tbody>
                {list.data.map((r) => (
                  <tr key={r.id}>
                    <td className="k-cell-ref">{refCell(r)}</td>
                    <td>{r.service.name}<span className="k-cell-sub">{r.service.code}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{r.status === 'DRAFT' ? <span className="k-muted">Not submitted</span> : fmtDate(r.submittedAt)}</td>
                    <td>{dueCell(r)}</td>
                    <td style={{ textAlign: 'right' }}>{nextStep(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="k-cards">
            {list.data.map((r) => (
              <div className="k-card" key={r.id}>
                <div className="k-row" style={{ justifyContent: 'space-between' }}><span className="k-mono k-strong k-small">{refCell(r)}</span><StatusBadge status={r.status} /></div>
                <span className="k-small">{r.service.name} · {r.service.code}</span>
                <div className="k-row" style={{ justifyContent: 'space-between' }}><span className="k-xs k-muted">{dueCell(r)}</span>{nextStep(r)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
