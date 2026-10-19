import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiProblem } from '../api/http';
import { khidma, type QueueRow } from '../api/khidma';
import { useSession } from '../session/SessionContext';
import { AssignDialog } from '../ui/AssignDialog';
import { SlaBadge, StatusBadge } from '../ui/Badges';
import { daysLeftText, firstName, fmtDayMonth, STATUS_LABEL } from '../ui/format';
import { Icon } from '../ui/Icon';
import { Empty, LoadError, Skeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { useLoad } from '../ui/useLoad';

const STATUS_OPTIONS: [string, string][] = [['open', 'All open'], ['SUBMITTED', 'Submitted'], ['IN_REVIEW', 'In review'], ['INFO_REQUESTED', 'Info requested'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['WITHDRAWN', 'Withdrawn']];

// S-09 (F-11, F-12, F-17): department queue, OVERDUE → AT_RISK → dueAt (BR-13), filters by status and service.
export function QueuePage() {
  const { user } = useSession();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'open';
  const service = params.get('service') ?? '';
  const rows = useLoad(() => khidma.queue(status, service), [status, service]);
  const services = useLoad(() => khidma.services(), []);
  const load = useLoad(() => (user?.role === 'REVIEWER' ? khidma.myLoad() : Promise.resolve(null)), [user?.role]);
  const [problem, setProblem] = useState<{ title: string; text: string; tone: 'error' | 'warn' } | null>(null);
  const [assigning, setAssigning] = useState<QueueRow | null>(null);
  const isSupervisor = user?.role === 'SUPERVISOR';
  const deptServices = (services.data ?? []).filter((s) => s.department.id === user?.departmentId);
  const deptName = deptServices[0]?.department.name ?? 'Department';

  function setFilter(key: 'status' | 'service', value: string) {
    const next = new URLSearchParams(params);
    if (!value || (key === 'status' && value === 'open')) next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  }
  async function pick(r: QueueRow) {
    setProblem(null);
    try {
      await khidma.pick(r.id);
      toast(`${r.referenceNo} is now assigned to you`);
      rows.reload(); load.reload();
    } catch (e) {
      if (e instanceof ApiProblem && e.code === 'LOAD_LIMIT') setProblem({ tone: 'error', title: `You're at your limit of ${String(e.body.limit ?? 10)} active requests`, text: 'Decide or close some of your requests before picking another. A supervisor can still assign this one to you.' });
      else if (e instanceof ApiProblem && e.code === 'INVALID_TRANSITION') { setProblem({ tone: 'warn', title: 'Someone picked this request a moment ago', text: 'The queue has been refreshed.' }); rows.reload(); }
      else setProblem({ tone: 'error', title: 'Something went wrong', text: 'Your action was not applied. Try again in a moment.' });
    }
  }
  async function assign(reviewerId: number) {
    if (!assigning) return;
    try {
      await khidma.assign(assigning.id, reviewerId);
      toast(`${assigning.referenceNo} ${assigning.assignee ? 'reassigned' : 'assigned'}`);
      setAssigning(null); rows.reload();
    } catch (e) {
      setAssigning(null);
      if (e instanceof ApiProblem && e.code === 'INVALID_TRANSITION') { setProblem({ tone: 'warn', title: 'This request has changed', text: 'It was updated while you were viewing it, so your action wasn\'t applied.' }); rows.reload(); }
      else setProblem({ tone: 'error', title: 'Something went wrong', text: 'The request was not assigned. Try again in a moment.' });
    }
  }

  const list = rows.data ?? [];
  const counts = { over: list.filter((r) => r.sla === 'OVERDUE').length, risk: list.filter((r) => r.sla === 'AT_RISK').length, unassigned: list.filter((r) => !r.assignee && r.status === 'SUBMITTED').length };
  const assigneeCell = (r: QueueRow) => !r.assignee ? <span className="k-muted">Unassigned</span> : r.assignee.id === user?.id ? <b>You</b> : firstName(r.assignee.name);
  const actionCell = (r: QueueRow) => (
    <div className="k-row" style={{ justifyContent: 'flex-end', gap: 6 }}>
      {r.actions.pick && <button className="k-btn k-btn-primary k-btn-sm" type="button" onClick={() => pick(r)}>Pick</button>}
      {!r.actions.pick && <Link className={`k-btn k-btn-sm ${r.assignee?.id === user?.id ? 'k-btn-secondary' : 'k-btn-ghost'}`} to={`/staff/requests/${r.id}`}>{r.assignee?.id === user?.id ? 'Open' : 'View'}</Link>}
      {r.actions.assign && <button className="k-btn k-btn-primary k-btn-sm" type="button" onClick={() => setAssigning(r)}>Assign</button>}
      {r.actions.reassign && <button className="k-btn k-btn-secondary k-btn-sm" type="button" onClick={() => setAssigning(r)}>Reassign</button>}
    </div>
  );
  const dueCell = (r: QueueRow) => <>{fmtDayMonth(r.dueAt)}<span className="k-cell-sub">{r.sla === 'OVERDUE' ? `Late since ${fmtDayMonth(r.dueAt)}` : daysLeftText(r.workingDaysLeft)}</span></>;

  return (
    <main className="k-main">
      <div className="k-page-head">
        <div className="k-stack-sm"><h1 className="k-h1">{deptName} queue</h1><p className="k-muted">{isSupervisor ? 'Assign unassigned requests and rebalance work. ' : ''}Overdue first, then at risk, then by due date.</p></div>
        {load.data && (
          <div className="k-card" style={{ padding: '12px 16px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="k-row" style={{ justifyContent: 'space-between' }}><span className="k-small k-strong">Your active requests</span><span className="k-small k-mono">{load.data.active} / {load.data.limit}</span></div>
            <div className={`k-meter${load.data.active >= load.data.limit ? ' is-full' : load.data.active / load.data.limit >= 0.8 ? ' is-high' : ''}`}><span style={{ width: `${Math.min(100, (load.data.active / load.data.limit) * 100)}%` }} /></div>
          </div>
        )}
      </div>
      {problem && (
        <div className={`k-alert k-alert-${problem.tone}`} role="alert" style={{ marginBottom: 16 }}><Icon name={problem.tone === 'warn' ? 'alertTriangle' : 'alertCircle'} /><div className="k-alert-body"><b>{problem.title}</b><span className="k-small">{problem.text}</span></div></div>
      )}
      <div className="k-toolbar">
        <div className="k-field"><label className="k-label" htmlFor="fs">Status</label>
          <select className="k-select" id="fs" value={status} onChange={(e) => setFilter('status', e.target.value)}>{STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="k-field"><label className="k-label" htmlFor="fsv">Service</label>
          <select className="k-select" id="fsv" value={service} onChange={(e) => setFilter('service', e.target.value)}>
            <option value="">All {deptName} services</option>{deptServices.map((s) => <option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}
          </select></div>
        <span className="k-spacer" />
        {rows.data && (
          <div className="k-row" style={{ paddingBottom: 8, gap: 8 }}>
            {counts.over > 0 && <span className="k-sla sla-over">{counts.over} overdue</span>}
            {counts.risk > 0 && <span className="k-sla sla-risk">{counts.risk} at risk</span>}
            {counts.unassigned > 0 && <span className="k-tag">{counts.unassigned} unassigned</span>}
            <span className="k-small k-muted">{list.length} request{list.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>
      {rows.error ? <LoadError what="the queue" onRetry={rows.reload} /> : !rows.data ? <Skeleton rows={5} /> : list.length === 0 ? (
        status === 'open' && !service
          ? <Empty icon="inbox" title="The queue is clear" text={`There are no open requests in ${deptName} right now.`} />
          : <Empty icon="search" title="No requests match these filters" text={`Status: ${status === 'open' ? 'All open' : STATUS_LABEL[status as keyof typeof STATUS_LABEL]}${service ? ` · Service: ${service}` : ''}`} action={<button className="k-btn k-btn-secondary k-btn-sm" type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear filters</button>} />
      ) : (
        <>
          <div className="k-table-wrap has-cards">
            <table className="k-table">
              <thead><tr><th>Reference</th><th>Service</th><th>Applicant</th><th>Status</th><th>SLA</th><th>Due</th><th>Assignee</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className={r.sla === 'OVERDUE' ? 'is-overdue' : r.sla === 'AT_RISK' ? 'is-risk' : ''}>
                    <td className="k-cell-ref"><Link to={`/staff/requests/${r.id}`}>{r.referenceNo}</Link></td>
                    <td>{r.service.code}</td><td>{r.applicantName}</td><td><StatusBadge status={r.status} /></td>
                    <td>{r.sla ? <SlaBadge sla={r.sla} /> : <span className="k-sla sla-none">—</span>}</td>
                    <td>{dueCell(r)}</td><td>{assigneeCell(r)}</td><td style={{ textAlign: 'right' }}>{actionCell(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="k-cards">
            {list.map((r) => (
              <div className="k-card" key={r.id}>
                <div className="k-row" style={{ justifyContent: 'space-between' }}><Link className="k-mono k-strong k-small" to={`/staff/requests/${r.id}`}>{r.referenceNo}</Link><SlaBadge sla={r.sla} /></div>
                <span className="k-small">{r.applicantName} · {r.service.code}</span>
                <div className="k-row" style={{ justifyContent: 'space-between' }}><StatusBadge status={r.status} /><span className="k-xs k-muted">Due {fmtDayMonth(r.dueAt)} · {r.assignee ? (r.assignee.id === user?.id ? 'You' : firstName(r.assignee.name)) : 'Unassigned'}</span></div>
                {actionCell(r)}
              </div>
            ))}
          </div>
        </>
      )}
      {assigning && <AssignDialog referenceNo={assigning.referenceNo} statusText={STATUS_LABEL[assigning.status]} currentAssigneeId={assigning.assignee?.id ?? null} onClose={() => setAssigning(null)} onAssign={assign} />}
    </main>
  );
}
