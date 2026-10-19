import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiProblem } from '../api/http';
import { khidma, type RequestDetail } from '../api/khidma';
import { useSession } from '../session/SessionContext';
import { AssignDialog } from '../ui/AssignDialog';
import { SlaBadge, StatusBadge } from '../ui/Badges';
import { Dialog } from '../ui/Dialog';
import { firstName, fmtDate, fmtDateTime, fmtDayMonth, fmtIsoDay, REJECT_REASON_LABEL, STATUS_LABEL } from '../ui/format';
import { Icon } from '../ui/Icon';
import { ChangedAlert, Forbidden, LoadError, NotFound, Skeleton } from '../ui/States';
import { CommentList, Timeline } from '../ui/Timeline';
import { useToast } from '../ui/Toast';
import { statusOf, useLoad } from '../ui/useLoad';

const codePoints = (s: string) => [...s.trim()].length;
type Open = null | 'info' | 'approve' | 'reject' | 'assign';

// S-10 (F-12 … F-15, F-21): staff review of one department request. Actions follow the API's role × state table.
export function ReviewPage() {
  const id = Number(useParams().id);
  const req = useLoad(() => khidma.request(id), [id]);
  if (req.error) {
    const s = statusOf(req.error);
    return s === 404 ? <NotFound /> : s === 403 ? <Forbidden home="/staff/review" homeLabel="Go to queue" /> : <main className="k-main"><LoadError what="this request" onRetry={req.reload} /></main>;
  }
  if (!req.data) return <main className="k-main"><Skeleton rows={6} /></main>;
  return <Review r={req.data} set={req.set} reload={req.reload} />;
}

function Review({ r, set, reload }: { r: RequestDetail; set(r: RequestDetail): void; reload(): void }) {
  const { user } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState<Open>(null);
  const [changed, setChanged] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [tab, setTab] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [comment, setComment] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [success, setSuccess] = useState<string | null>(null);
  const a = r.actions;
  const mine = r.assignee?.id === user?.id;
  const isSupervisor = user?.role === 'SUPERVISOR';

  async function act(fn: () => Promise<RequestDetail>, msg?: { toast?: string; alert?: string }) {
    setProblem(null); setChanged(false);
    try {
      set(await fn());
      setOpen(null);
      if (msg?.toast) toast(msg.toast);
      if (msg?.alert) setSuccess(msg.alert);
      return true;
    } catch (e) {
      if (e instanceof ApiProblem && e.code === 'INVALID_TRANSITION') { setOpen(null); setChanged(true); }
      else if (e instanceof ApiProblem && e.code === 'LOAD_LIMIT') { setProblem(`You're at your limit of ${String(e.body.limit ?? 10)} active requests. Decide or close some of your requests before picking another. A supervisor can still assign this one to you.`); }
      else if (e instanceof ApiProblem && e.code === 'INFO_LIMIT') { setOpen(null); setProblem("You've asked for information twice, the maximum for one request. Approve or reject it."); }
      else { setOpen(null); setProblem(e instanceof ApiProblem ? e.message : 'Something went wrong. Try again in a moment.'); }
      return false;
    }
  }

  const internal = r.comments.filter((c) => c.visibility === 'INTERNAL');
  const publicComments = r.comments.filter((c) => c.visibility === 'PUBLIC');
  const shown = tab === 'PUBLIC' ? publicComments : internal;
  const pickedEntry = [...r.timeline].reverse().find((e) => e.action === 'PICK' || e.action === 'ASSIGN' || e.action === 'REASSIGN');
  const canDecide = a.requestInfo || a.approve || a.reject;
  const sub = r.assignee ? (mine ? `Assigned to you${pickedEntry ? ` · ${pickedEntry.action === 'PICK' ? 'picked' : 'assigned'} ${fmtDateTime(pickedEntry.at)}` : ''}` : `Assigned to ${r.assignee.name}`) : r.status === 'SUBMITTED' ? 'Unassigned · waiting in the queue' : '';

  return (
    <main className="k-main">
      <nav className="k-crumbs" aria-label="Breadcrumb"><Link to="/staff/review">Queue</Link><Icon name="chevronRight" small /><span className="k-mono">{r.referenceNo}</span></nav>
      <div className="k-page-head">
        <div className="k-stack-sm">
          <div className="k-row"><span className="k-mono k-strong">{r.referenceNo}</span><StatusBadge status={r.status} /><SlaBadge sla={r.sla} suffix={r.sla ? `due ${fmtDayMonth(r.dueAt)}` : undefined} /></div>
          <h1 className="k-h1">{r.service.name}</h1>
          {sub && <p className="k-small k-muted">{sub}</p>}
        </div>
        {a.pick && <button className="k-btn k-btn-primary" type="button" onClick={() => act(() => khidma.pick(r.id), { toast: `${r.referenceNo} is now assigned to you` })}>Pick this request</button>}
        {a.assign && <button className="k-btn k-btn-primary" type="button" onClick={() => setOpen('assign')}><Icon name="userPlus" />Assign</button>}
      </div>

      {success && <div className="k-alert k-alert-success" role="status" style={{ marginBottom: 16 }}><Icon name="checkCircle" /><div className="k-alert-body"><span className="k-small"><b>{success}</b></span></div></div>}
      {changed && <div style={{ marginBottom: 16 }}><ChangedAlert onReload={() => { setChanged(false); reload(); }} /></div>}
      {problem && <div className="k-alert k-alert-error" role="alert" style={{ marginBottom: 16 }}><Icon name="alertCircle" /><div className="k-alert-body"><span className="k-small">{problem}</span></div></div>}

      {(canDecide || a.reassign) && (
        <div className="k-card" style={{ padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="k-small k-strong" style={{ flex: '1 1 200px' }}>{canDecide ? 'Your decision' : 'Assignment'}</span>
          {a.reassign && <button className="k-btn k-btn-ghost" type="button" onClick={() => setOpen('assign')}>Reassign</button>}
          {canDecide && <>
            <span title={a.requestInfoLimitReached ? "You've asked for information twice, the maximum for one request. Approve or reject it." : undefined}>
              <button className="k-btn k-btn-secondary" type="button" disabled={a.requestInfoLimitReached} onClick={() => setOpen('info')}><Icon name="message" />Request information</button>
            </span>
            {a.requestInfoLimitReached && <span className="k-tag">2 of 2 used</span>}
            <button className="k-btn k-btn-danger-outline" type="button" onClick={() => setOpen('reject')}><Icon name="xCircle" />Reject</button>
            <button className="k-btn k-btn-primary" type="button" onClick={() => setOpen('approve')}><Icon name="check" />Approve</button>
          </>}
        </div>
      )}
      {canDecide && isSupervisor && r.assignee && !mine && (
        <div className="k-alert k-alert-warn" style={{ marginBottom: 24 }}><Icon name="info" /><div className="k-alert-body"><b>Assigned to {r.assignee.name}</b><span className="k-small">As supervisor you can decide this request directly. The decision is recorded under your name.</span></div></div>
      )}
      {!canDecide && r.status === 'IN_REVIEW' && !isSupervisor && r.assignee && !mine && (
        <div className="k-alert k-alert-info" style={{ marginBottom: 24 }}><Icon name="lock" /><div className="k-alert-body"><b>Assigned to {r.assignee.name}</b><span className="k-small">Only the assignee or a supervisor can request information or decide.</span></div></div>
      )}
      {r.status === 'INFO_REQUESTED' && (
        <div className="k-alert k-alert-warn" style={{ marginBottom: 24 }}><Icon name="clock" /><div className="k-alert-body"><b>Waiting for the applicant</b><span className="k-small">Information request {r.infoCycles} of 2 was sent. Actions unlock when the applicant responds. The due date keeps running.</span>{r.infoMessage && <span className="k-small k-muted">“{r.infoMessage}”</span>}</div></div>
      )}
      {r.status === 'APPROVED' && r.certificate && (
        <div className="k-alert k-alert-success" style={{ marginBottom: 24 }}><Icon name="award" /><div className="k-alert-body"><b>Approved · certificate <span className="k-mono">{r.certificate.certificateNo}</span></b><span className="k-small">Valid until {fmtIsoDay(r.certificate.validUntil)}. Decided {fmtDateTime(r.decidedAt)}.</span></div></div>
      )}
      {r.status === 'REJECTED' && (
        <div className="k-alert k-alert-error" style={{ marginBottom: 24 }}><Icon name="xCircle" /><div className="k-alert-body"><b>Rejected · {REJECT_REASON_LABEL[r.rejectReason ?? ''] ?? r.rejectReason}</b><span className="k-small">{r.rejectJustification}</span></div></div>
      )}
      {r.status === 'WITHDRAWN' && (
        <div className="k-alert" style={{ marginBottom: 24, borderColor: '#DDE2DE', background: '#F0F2EF' }}><Icon name="undo" /><div className="k-alert-body"><b>Withdrawn by the applicant</b><span className="k-small">The request is closed.</span></div></div>
      )}

      <div className="k-split">
        <div className="k-split-main">
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Applicant</h2></div>
            <dl className="k-dl k-card-body">
              <div><dt>Name</dt><dd>{r.applicant.name}</dd></div>
              <div><dt>National ID</dt><dd className="k-row" style={{ gap: 8 }}><span className="k-mono">{r.applicant.nationalId}</span>{mine && <span className="k-tag" title="Shown in full to the assigned reviewer only"><Icon name="eye" small />Visible to you as assignee</span>}</dd></div>
            </dl>
          </section>
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Request details</h2></div>
            <dl className="k-dl k-card-body">{r.fields.map((f) => <div key={f.name}><dt>{f.label}</dt><dd>{f.type === 'date' ? fmtIsoDay(String(r.formData[f.name] ?? '')) : r.formData[f.name] ?? '—'}</dd></div>)}</dl>
          </section>
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Declared documents</h2><span className="k-small k-muted">{r.documents.filter((d) => d.mandatory && d.documentNumber).length} of {r.documents.filter((d) => d.mandatory).length} required declared</span></div>
            <div className="k-card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {r.documents.map((d) => (
                <div className="k-doc" key={d.typeCode}>
                  <span className={`k-doc-icon${d.documentNumber ? ' is-done' : ''}`}><Icon name={d.documentNumber ? 'fileCheck' : 'fileText'} /></span>
                  <div className="k-row" style={{ justifyContent: 'space-between' }}><span><b className="k-small">{d.label}</b><span className="k-cell-sub k-mono">{d.typeCode} · {d.mandatory ? 'required' : 'optional'}</span></span><span className="k-mono" style={{ fontSize: 15, fontWeight: 600 }}>{d.documentNumber ?? '—'}</span></div>
                </div>
              ))}
            </div>
          </section>
          <section className="k-card">
            <div className="k-tabs" role="tablist">
              <button className={tab === 'PUBLIC' ? 'is-on' : ''} type="button" role="tab" aria-selected={tab === 'PUBLIC'} onClick={() => setTab('PUBLIC')}>Comments <span className="k-num k-xs">{publicComments.length}</span></button>
              <button className={tab === 'INTERNAL' ? 'is-on' : ''} type="button" role="tab" aria-selected={tab === 'INTERNAL'} onClick={() => setTab('INTERNAL')}><Icon name="lock" small />Internal notes <span className="k-num k-xs">{internal.length}</span></button>
            </div>
            <div className="k-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {shown.length === 0 ? <span className="k-small k-muted">{tab === 'PUBLIC' ? 'No comments on this request.' : 'No internal notes yet.'}</span> : <CommentList comments={shown} />}
              {a.comment && (
                <>
                  <hr className="k-divider" />
                  <div className="k-field"><label className="k-label" htmlFor="cmt">Add a comment</label><textarea className="k-textarea" id="cmt" style={{ minHeight: 80 }} maxLength={1000} placeholder="Write a comment" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
                  <div className="k-row" style={{ justifyContent: 'space-between' }}>
                    <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <legend className="k-small k-muted" style={{ float: 'left', marginRight: 8, paddingTop: 8 }}>Visible to</legend>
                      {([['PUBLIC', 'Applicant and staff'], ['INTERNAL', 'Staff only']] as const).map(([v, l]) => (
                        <label key={v} className={`k-radio-card${visibility === v ? ' is-on' : ''}`} style={{ padding: '8px 12px' }}><input type="radio" name="vis" checked={visibility === v} onChange={() => setVisibility(v)} /><span className="k-small k-strong">{l}</span></label>
                      ))}
                    </fieldset>
                    <button className="k-btn k-btn-secondary k-btn-sm" type="button" disabled={!comment.trim()} onClick={async () => { if (await act(() => khidma.comment(r.id, visibility, comment), { toast: visibility === 'INTERNAL' ? 'Internal note posted' : 'Comment posted' })) { setComment(''); setTab(visibility); } }}>Post</button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
        <aside className="k-split-side">
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Summary</h2></div>
            <div className="k-card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              <div className="k-kv"><span>Service</span><span>{r.service.code} · {r.service.slaDays} wd</span></div>
              <div className="k-kv"><span>Submitted</span><span>{fmtDateTime(r.submittedAt)}</span></div>
              <div className="k-kv"><span>Due</span><span>{fmtDate(r.dueAt)}</span></div>
              <div className="k-kv"><span>SLA</span><span>{r.sla ? <SlaBadge sla={r.sla} /> : '—'}</span></div>
              <div className="k-kv"><span>Assignee</span><span>{r.assignee ? (mine ? `${firstName(r.assignee.name ?? '')} (you)` : r.assignee.name) : 'Unassigned'}</span></div>
              <div className="k-kv"><span>Info requests used</span><span>{r.infoCycles} of 2</span></div>
            </div>
          </section>
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Activity</h2><span className="k-xs k-muted">Append-only</span></div>
            <div className="k-card-body"><Timeline entries={r.timeline} /></div>
          </section>
        </aside>
      </div>

      {open === 'info' && <RequestInfoDialog r={r} onClose={() => setOpen(null)} onSend={(m) => act(() => khidma.requestInfo(r.id, m), { toast: 'Information requested' })} />}
      {open === 'approve' && <ApproveDialog r={r} onClose={() => setOpen(null)} onApprove={() => act(() => khidma.approve(r.id), { alert: 'Request approved. A certificate was issued and the applicant was notified.' })} />}
      {open === 'reject' && <RejectDialog r={r} onClose={() => setOpen(null)} onReject={(c, j) => act(() => khidma.reject(r.id, c, j), { alert: 'Request rejected. The applicant was notified with the reason.' })} />}
      {open === 'assign' && <AssignDialog referenceNo={r.referenceNo ?? ''} statusText={STATUS_LABEL[r.status]} currentAssigneeId={r.assignee?.id ?? null} onClose={() => setOpen(null)} onAssign={async (rid) => { await act(() => khidma.assign(r.id, rid), { toast: r.assignee ? 'Request reassigned' : 'Request assigned' }); }} />}
    </main>
  );
}

const subtitle = (r: RequestDetail) => <><span className="k-mono">{r.referenceNo}</span> · {r.applicant.name}</>;

/** D-2 (BR-07): message ≥ 20 characters, shown to the applicant as written. */
function RequestInfoDialog({ r, onClose, onSend }: { r: RequestDetail; onClose(): void; onSend(m: string): Promise<boolean> }) {
  const [msg, setMsg] = useState('');
  const [tried, setTried] = useState(false);
  const n = codePoints(msg);
  const ok = n >= 20;
  return (
    <Dialog title="Request information" subtitle={subtitle(r)} icon="message" tone="info" onClose={onClose}
      footer={<><button className="k-btn k-btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="k-btn k-btn-primary" type="button" onClick={() => { setTried(true); if (ok) void onSend(msg.trim()); }}><Icon name="send" />Send request</button></>}>
      <div className={`k-field${tried && !ok ? ' is-error' : ''}`}>
        <label className="k-label" htmlFor="msg">Message to the applicant<span className="k-req">*</span></label>
        <textarea className="k-textarea" id="msg" style={{ minHeight: 140 }} maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)} autoFocus />
        <div className="k-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {tried && !ok ? <span className="k-err"><Icon name="alertCircle" small />Write at least 20 characters.</span> : <span className="k-hint">The applicant sees this message exactly as written.</span>}
          <span className={`k-counter${tried && !ok ? ' is-bad' : ''}`}>{n} characters · min 20</span>
        </div>
      </div>
      <div className="k-alert k-alert-info"><Icon name="info" /><div className="k-alert-body"><b style={{ color: '#1D4F91' }}>This is information request {r.infoCycles + 1} of 2.</b><span className="k-small">The applicant can edit the form and document numbers, then respond. The request comes back to the assignee. The due date does not pause.</span></div></div>
    </Dialog>
  );
}

/** D-5: approve confirmation (design choice; BR-09 issues the number on approval). */
function ApproveDialog({ r, onClose, onApprove }: { r: RequestDetail; onClose(): void; onApprove(): Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Approve this request?" subtitle={subtitle(r)} icon="award" tone="ok" maxWidth={520} onClose={onClose}
      footer={<><button className="k-btn k-btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="k-btn k-btn-primary" type="button" disabled={busy} onClick={async () => { setBusy(true); await onApprove(); setBusy(false); }}><Icon name="check" />Approve and issue</button></>}>
      <p>A certificate will be issued and the applicant will be notified. Decisions are final.</p>
      <div className="k-card" style={{ padding: '4px 16px', background: '#F5F6F4' }}>
        <div className="k-kv"><span>Certificate number</span><span className="k-mono">{r.service.code}-{new Date().getFullYear()}-#####</span></div>
        <div className="k-kv"><span>Validity</span><span>12 months from today</span></div>
      </div>
    </Dialog>
  );
}

/** D-3 (BR-08): reason code + justification ≥ 30 characters, shown to the applicant. */
function RejectDialog({ r, onClose, onReject }: { r: RequestDetail; onClose(): void; onReject(code: string, justification: string): Promise<boolean> }) {
  const [code, setCode] = useState('');
  const [text, setText] = useState('');
  const [tried, setTried] = useState(false);
  const n = codePoints(text);
  const textOk = n >= 30;
  return (
    <Dialog title="Reject request" subtitle={subtitle(r)} icon="xCircle" tone="bad" onClose={onClose}
      footer={<><button className="k-btn k-btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="k-btn k-btn-danger" type="button" onClick={() => { setTried(true); if (code && textOk) void onReject(code, text.trim()); }}>Reject request</button></>}>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <legend className="k-label" style={{ marginBottom: 8 }}>Reason<span className="k-req">*</span></legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {Object.entries(REJECT_REASON_LABEL).map(([c, l]) => (
            <label key={c} className={`k-radio-card${code === c ? ' is-on' : ''}`}><input type="radio" name="reason" checked={code === c} onChange={() => setCode(c)} /><span><b className="k-small">{l}</b><span className="k-xs k-mono k-muted" style={{ display: 'block' }}>{c}</span></span></label>
          ))}
        </div>
        {tried && !code && <span className="k-err"><Icon name="alertCircle" small />Choose a reason.</span>}
      </fieldset>
      <div className={`k-field${tried && !textOk ? ' is-error' : ''}`}>
        <label className="k-label" htmlFor="just">Justification<span className="k-req">*</span></label>
        <textarea className="k-textarea" id="just" style={{ minHeight: 112 }} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="k-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {tried && !textOk ? <span className="k-err"><Icon name="alertCircle" small />Write at least 30 characters.</span> : <span />}
          <span className={`k-counter${tried && !textOk ? ' is-bad' : ''}`}>{n} / 30 min</span>
        </div>
        <span className="k-hint">The applicant sees the reason and this justification.</span>
      </div>
    </Dialog>
  );
}

