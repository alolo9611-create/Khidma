import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ApiProblem } from '../api/http';
import { khidma, type RequestDetail } from '../api/khidma';
import { SlaBadge, StatusBadge } from '../ui/Badges';
import { Dialog } from '../ui/Dialog';
import { fmtDate, fmtDateTime, fmtIsoDay, REJECT_REASON_LABEL, STATUS_LABEL } from '../ui/format';
import { Icon } from '../ui/Icon';
import { declaredCount, DocumentsEditor, draftFrom, ErrorSummary, FieldsEditor, toBody, type Draft } from '../ui/RequestForm';
import { ChangedAlert, Forbidden, LoadError, NotFound, Skeleton } from '../ui/States';
import { CommentList, Timeline } from '../ui/Timeline';
import { useToast } from '../ui/Toast';
import { statusOf, useLoad } from '../ui/useLoad';

// S-08 (F-09, F-10, F-13 respond, F-15, F-21): applicant view of one request.
export function ApplicantRequestPage() {
  const id = Number(useParams().id);
  const req = useLoad(() => khidma.request(id), [id]);
  if (req.error) {
    const s = statusOf(req.error);
    return s === 404 ? <NotFound /> : s === 403 ? <Forbidden home="/applicant" homeLabel="Go to my requests" /> : <main className="k-main"><LoadError what="this request" onRetry={req.reload} /></main>;
  }
  if (!req.data) return <main className="k-main"><Skeleton rows={6} /></main>;
  if (req.data.status === 'DRAFT') return <Navigate to={`/applicant/requests/${id}/edit`} replace />;
  return <Detail r={req.data} set={req.set} reload={req.reload} />;
}

function Steps({ r }: { r: RequestDetail }) {
  const decided = r.status === 'APPROVED' || r.status === 'REJECTED';
  const reviewDone = r.status !== 'SUBMITTED';
  return (
    <ol className="k-steps k-card" style={{ padding: '14px 20px', marginBottom: 24 }} aria-label="Progress">
      <li className="k-step is-done"><span className="k-step-n"><Icon name="check" small /></span>Submitted</li><li className="k-step-sep" aria-hidden="true" />
      <li className={`k-step ${reviewDone ? 'is-done' : 'is-on'}`}><span className="k-step-n">{reviewDone ? <Icon name="check" small /> : 2}</span>In review</li><li className="k-step-sep" aria-hidden="true" />
      {r.status === 'INFO_REQUESTED' && <><li className="k-step is-on" style={{ color: '#8A4B00' }}><span className="k-step-n" style={{ borderColor: '#D08A1E', color: '#8A4B00', background: '#FCEFD9' }}>!</span>Waiting for your response</li><li className="k-step-sep" aria-hidden="true" /></>}
      <li className={`k-step${decided ? ' is-done' : ''}`}><span className="k-step-n">{decided ? <Icon name="check" small /> : r.status === 'INFO_REQUESTED' ? 4 : 3}</span>{r.status === 'WITHDRAWN' ? 'Withdrawn' : 'Decision'}</li>
    </ol>
  );
}

function Detail({ r, set, reload }: { r: RequestDetail; set(r: RequestDetail): void; reload(): void }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(r));
  const [errors, setErrors] = useState<string[]>([]);
  const [changed, setChanged] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [comment, setComment] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const previous = Object.fromEntries(r.documents.map((d) => [d.typeCode, d.documentNumber]));
  useEffect(() => setDraft(draftFrom(r)), [r.id, r.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(fn: () => Promise<RequestDetail>, ok?: string): Promise<boolean> {
    setBusy(true); setProblem(null); setChanged(false);
    try {
      const updated = await fn();
      set(updated);
      if (ok) toast(ok);
      return true;
    } catch (e) {
      if (e instanceof ApiProblem && e.code === 'INVALID_TRANSITION') setChanged(true);
      else if (e instanceof ApiProblem && (e.code === 'REQ_INCOMPLETE' || e.code === 'VALIDATION_ERROR')) setErrors(e.fields);
      else setProblem(e instanceof ApiProblem ? e.message : 'Something went wrong. Try again in a moment.');
      return false;
    } finally { setBusy(false); }
  }
  const saveChanges = () => act(() => khidma.save(r.id, toBody(r, draft)), 'Changes saved').then((ok) => ok && setErrors([]));
  async function sendResponse() {
    if (!(await act(() => khidma.save(r.id, toBody(r, draft))))) return;
    if (await act(() => khidma.respond(r.id, response.trim()), 'Response sent')) { setErrors([]); setResponse(''); }
  }
  async function withdraw() {
    if (await act(() => khidma.withdraw(r.id), 'Request withdrawn')) setWithdrawOpen(false);
  }
  async function postComment() {
    if (!comment.trim()) return;
    if (await act(() => khidma.comment(r.id, 'PUBLIC', comment), 'Comment posted')) setComment('');
  }

  const editing = r.actions.edit && r.status === 'INFO_REQUESTED';
  const docs = declaredCount(r, draft);

  return (
    <main className="k-main">
      <nav className="k-crumbs" aria-label="Breadcrumb"><Link to="/applicant">My requests</Link><Icon name="chevronRight" small /><span className="k-mono">{r.referenceNo}</span></nav>
      <div className="k-page-head">
        <div className="k-stack-sm"><div className="k-row"><span className="k-mono k-strong">{r.referenceNo}</span><StatusBadge status={r.status} /><SlaBadge sla={r.sla} /></div><h1 className="k-h1">{r.service.name}</h1></div>
        {r.actions.withdraw && <button className="k-btn k-btn-danger-outline" type="button" onClick={() => setWithdrawOpen(true)}><Icon name="undo" />Withdraw request</button>}
      </div>
      {r.status !== 'WITHDRAWN' && <Steps r={r} />}
      <div className="k-split">
        <div className="k-split-main">
          {changed && <ChangedAlert onReload={() => { setChanged(false); reload(); }} />}
          {problem && <div className="k-alert k-alert-error" role="alert"><Icon name="alertCircle" /><div className="k-alert-body"><span className="k-small"><b>{problem}</b></span></div></div>}

          {r.status === 'SUBMITTED' && <StateAlert icon="info" title="Waiting for a reviewer" text={`Your request is in the queue. Decision due by ${fmtDate(r.dueAt)}. It can't be edited unless a reviewer asks for information.`} />}
          {r.status === 'IN_REVIEW' && <StateAlert icon="lock" title="A reviewer is checking your request" text={`Decision due by ${fmtDate(r.dueAt)}. You'll be notified if anything is needed.`} />}
          {r.status === 'WITHDRAWN' && (
            <div className="k-alert" style={{ borderColor: '#DDE2DE', background: '#F0F2EF' }}><Icon name="undo" /><div className="k-alert-body"><b>You withdrew this request{r.timeline.find((e) => e.action === 'WITHDRAW') ? ` on ${fmtDate(r.timeline.find((e) => e.action === 'WITHDRAW')!.at)}` : ''}</b><span className="k-small">It is closed and can't be reopened.</span></div></div>
          )}
          {r.status === 'INFO_REQUESTED' && (
            <section className="k-card" style={{ borderColor: '#EDCB8F', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', background: '#FDF5E6', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span className="k-dialog-icon" style={{ background: '#FCEFD9', color: '#8A4B00', border: '1px solid #EDCB8F' }}><Icon name="message" /></span>
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="k-row" style={{ justifyContent: 'space-between' }}><h2 className="k-h3" style={{ color: '#7A4300' }}>The reviewer needs more information</h2><span className="k-tag">Info request {r.infoCycles} of 2</span></div>
                  <blockquote style={{ margin: 0, padding: '12px 14px', background: '#FFFFFF', border: '1px solid #EDCB8F', borderRadius: 8, fontSize: 15, lineHeight: '24px' }}>{r.infoMessage}</blockquote>
                  <span className="k-small k-muted">The due date stays {fmtDate(r.dueAt)}.{r.infoCycles >= 2 ? ' This is the last time the reviewer can ask. Check every detail before you respond.' : ''}</span>
                </div>
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #EDCB8F', display: 'flex', gap: 10, alignItems: 'center' }} className="k-small"><Icon name="edit" /><span style={{ flex: 1 }}>You can now edit your request details and document numbers below. When you're done, send your response.</span></div>
            </section>
          )}
          {r.status === 'APPROVED' && r.certificate && <Approved r={r} />}
          {r.status === 'REJECTED' && (
            <section className="k-card" style={{ overflow: 'hidden', borderColor: '#F0B8B1' }}>
              <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start', background: '#FDF0EE', flexWrap: 'wrap' }}>
                <span className="k-dialog-icon" style={{ background: '#FBE9E7', color: '#A3261C' }}><Icon name="x" /></span>
                <div style={{ flex: 1 }}><div className="k-row"><h2 className="k-h3">Your request was rejected</h2><StatusBadge status="REJECTED" /></div><span className="k-small k-muted"><span className="k-mono">{r.referenceNo}</span> · {fmtDateTime(r.decidedAt)}</span></div>
              </div>
              <dl className="k-dl" style={{ padding: 24 }}>
                <div><dt>Reason</dt><dd>{REJECT_REASON_LABEL[r.rejectReason ?? ''] ?? r.rejectReason} <span className="k-mono k-xs k-muted">{r.rejectReason}</span></dd></div>
                <div><dt>Explanation from the reviewer</dt><dd>{r.rejectJustification}</dd></div>
              </dl>
            </section>
          )}

          <ErrorSummary errors={errors.filter((e) => e !== 'message')} r={r} />
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Request details</h2>{!editing && <span className="k-tag"><Icon name="lock" small />Read-only</span>}</div>
            {editing ? <div className="k-card-body"><FieldsEditor r={r} draft={draft} onChange={setDraft} errors={errors} /></div> : (
              <dl className="k-dl k-card-body">{r.fields.map((f) => <div key={f.name}><dt>{f.label}</dt><dd>{f.type === 'date' ? fmtIsoDay(String(r.formData[f.name] ?? '')) : r.formData[f.name] ?? '—'}</dd></div>)}</dl>
            )}
          </section>
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Declared documents</h2><span className="k-small k-muted">{docs.declared} of {docs.required} required declared</span></div>
            <div className="k-card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {editing ? <DocumentsEditor r={r} draft={draft} onChange={setDraft} errors={errors} previous={previous} /> : r.documents.map((d) => (
                <div className="k-doc" key={d.typeCode}>
                  <span className={`k-doc-icon${d.documentNumber ? ' is-done' : ''}`}><Icon name={d.documentNumber ? 'fileCheck' : 'fileText'} /></span>
                  <div className="k-row" style={{ justifyContent: 'space-between' }}><span><b className="k-small">{d.label}</b><span className="k-cell-sub k-mono">{d.typeCode}</span></span><span className="k-mono k-small">{d.documentNumber ?? '—'}</span></div>
                </div>
              ))}
            </div>
          </section>
          {r.actions.respond && (
            <section className="k-card">
              <div className="k-card-head"><h2 className="k-section-title">Send your response</h2></div>
              <div className="k-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className={`k-field${errors.includes('message') ? ' is-error' : ''}`}>
                  <label className="k-label" htmlFor="resp">Note to the reviewer <span className="k-opt">(optional)</span></label>
                  <textarea className="k-textarea" id="resp" style={{ minHeight: 88 }} maxLength={1000} value={response} onChange={(e) => setResponse(e.target.value)} />
                </div>
                <p className="k-small k-muted">Your request goes back to the reviewer and becomes read-only again.</p>
              </div>
              <div className="k-card-foot">
                <button className="k-btn k-btn-secondary" type="button" onClick={saveChanges} disabled={busy}>Save changes</button>
                <button className="k-btn k-btn-primary" type="button" onClick={sendResponse} disabled={busy}><Icon name="send" />Send response</button>
              </div>
            </section>
          )}
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Comments</h2></div>
            {r.comments.length === 0 && !r.actions.comment ? (
              <div className="k-empty" style={{ padding: '32px 24px' }}><span className="k-empty-icon" style={{ width: 44, height: 44 }}><Icon name="message" /></span><span className="k-small k-muted">No comments on this request.</span></div>
            ) : (
              <div className="k-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {r.comments.length === 0 && <span className="k-small k-muted">No comments on this request.</span>}
                <CommentList comments={r.comments} />
                {r.actions.comment && (
                  <>
                    <div className="k-field"><label className="k-label" htmlFor="cm">Add a comment</label><textarea className="k-textarea" id="cm" style={{ minHeight: 72 }} maxLength={1000} placeholder="Write a comment visible to GACS staff" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
                    <div className="k-row" style={{ justifyContent: 'flex-end' }}><button className="k-btn k-btn-secondary k-btn-sm" type="button" onClick={postComment} disabled={busy || !comment.trim()}>Post comment</button></div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
        <aside className="k-split-side">
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Summary</h2></div>
            <div className="k-card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              <div className="k-kv"><span>Reference</span><span className="k-mono">{r.referenceNo}</span></div>
              <div className="k-kv"><span>Service</span><span>{r.service.code}</span></div>
              <div className="k-kv"><span>Submitted</span><span>{fmtDateTime(r.submittedAt)}</span></div>
              <div className="k-kv"><span>Due date</span><span>{fmtDate(r.dueAt)}</span></div>
              {r.decidedAt && <div className="k-kv"><span>Decided</span><span>{fmtDateTime(r.decidedAt)}</span></div>}
              <div className="k-kv"><span>Status</span><span>{STATUS_LABEL[r.status]}</span></div>
              <div className="k-kv"><span>Applicant</span><span>{r.applicant.name}</span></div>
              <div className="k-kv"><span>National ID</span><span className="k-mono">{r.applicant.nationalId}</span></div>
            </div>
            <div className="k-card-foot" style={{ justifyContent: 'flex-start', background: '#FFFFFF' }}><span className="k-xs k-muted">Your own national ID is shown in full. Staff see it masked unless they are your assigned reviewer.</span></div>
          </section>
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Activity</h2></div>
            <div className="k-card-body"><Timeline entries={r.timeline} /></div>
          </section>
        </aside>
      </div>
      {r.status === 'INFO_REQUESTED' && r.actions.respond && (
        <div className="k-sticky-bar k-mobile-only"><button className="k-btn k-btn-primary" type="button" onClick={sendResponse} disabled={busy}>Send response</button></div>
      )}
      {withdrawOpen && (
        <Dialog title="Withdraw this request?" icon="undo" tone="bad" maxWidth={500} onClose={() => setWithdrawOpen(false)}
          footer={<><button className="k-btn k-btn-secondary" type="button" onClick={() => setWithdrawOpen(false)}>Keep request</button><button className="k-btn k-btn-danger" type="button" onClick={withdraw} disabled={busy}>Withdraw request</button></>}>
          <div className="k-card" style={{ padding: '12px 14px', background: '#F5F6F4', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><span className="k-mono k-strong">{r.referenceNo}</span><span className="k-small k-muted">{r.service.name} · {STATUS_LABEL[r.status]}</span></div>
          <p>The review will stop and the request will be closed as withdrawn. <b>This can't be undone.</b></p>
          <p className="k-small k-muted">To apply again later, you'll need to start a new request.</p>
        </Dialog>
      )}
    </main>
  );
}

function StateAlert({ icon, title, text }: { icon: 'info' | 'lock'; title: string; text: string }) {
  return <div className="k-alert k-alert-info"><Icon name={icon} /><div className="k-alert-body"><b>{title}</b><span className="k-small">{text}</span></div></div>;
}

function Approved({ r }: { r: RequestDetail }) {
  const toast = useToast();
  const c = r.certificate!;
  return (
    <section className="k-card" style={{ overflow: 'hidden', borderColor: '#A9D5B8' }}>
      <div style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', background: '#EEF7F1' }}>
        <span className="k-dialog-icon" style={{ width: 52, height: 52, background: '#17663E', color: '#fff' }}><Icon name="award" /></span>
        <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 2 }}><h2 className="k-h2" style={{ color: '#17663E' }}>Your permit was approved</h2><span className="k-small k-muted">Decided on {fmtDateTime(r.decidedAt)}</span></div>
      </div>
      <div style={{ padding: 24, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid #A9D5B8' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="k-eyebrow">Certificate number</span>
          <div className="k-row" style={{ gap: 8 }}><span className="k-mono" style={{ fontSize: 24, lineHeight: '32px', fontWeight: 600 }}>{c.certificateNo}</span><button className="k-icon-btn" type="button" aria-label="Copy certificate number" onClick={() => { void navigator.clipboard?.writeText(c.certificateNo); toast('Certificate number copied'); }}><Icon name="copy" /></button></div>
        </div>
        <dl className="k-dl" style={{ flex: '1 1 280px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}><div><dt>Issued</dt><dd>{fmtIsoDay(c.issuedOn)}</dd></div><div><dt>Valid until</dt><dd className="k-strong">{fmtIsoDay(c.validUntil)}</dd></div></dl>
      </div>
      <div className="k-card-foot" style={{ justifyContent: 'space-between', background: '#FFFFFF' }}>
        <span className="k-small k-muted">Anyone can check this certificate without seeing your personal details.</span>
        <Link className="k-btn k-btn-secondary k-btn-sm" to={`/verify/${c.certificateNo}`}><Icon name="checkCircle" />Open verify page</Link>
      </div>
    </section>
  );
}

