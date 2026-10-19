import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ApiProblem } from '../api/http';
import { khidma, type RequestDetail } from '../api/khidma';
import { StatusBadge } from '../ui/Badges';
import { fmtDate, fmtDateTime } from '../ui/format';
import { Icon } from '../ui/Icon';
import { declaredCount, DocumentsEditor, draftFrom, ErrorSummary, FieldsEditor, toBody, type Draft } from '../ui/RequestForm';
import { Forbidden, LoadError, NotFound, Skeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { statusOf, useLoad } from '../ui/useLoad';
import { StepNumber } from './CatalogPage';

// S-05 (F-05, F-06, BR-01): draft + document declaration. Submit stays enabled and explains what's missing.
export function RequestFormPage() {
  const id = Number(useParams().id);
  const req = useLoad(() => khidma.request(id), [id]);
  if (req.error) return statusOf(req.error) === 404 ? <NotFound /> : statusOf(req.error) === 403 ? <Forbidden home="/applicant" homeLabel="Go to my requests" /> : <main className="k-main"><LoadError what="this request" onRetry={req.reload} /></main>;
  if (!req.data) return <main className="k-main"><Skeleton rows={6} /></main>;
  if (req.data.status !== 'DRAFT') return <Navigate to={`/applicant/requests/${id}`} replace />;
  return <DraftEditor r={req.data} onSaved={req.set} />;
}

function DraftEditor({ r, onSaved }: { r: RequestDetail; onSaved(r: RequestDetail): void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(r));
  const [errors, setErrors] = useState<string[]>([]);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [busy, setBusy] = useState<'save' | 'submit' | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  useEffect(() => setDraft(draftFrom(r)), [r.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(quiet = false): Promise<RequestDetail | null> {
    try {
      const updated = await khidma.save(r.id, toBody(r, draft));
      onSaved(updated);
      setSavedAt(new Date().toISOString());
      if (!quiet) { setErrors([]); setProblem(null); toast('Draft saved'); }
      return updated;
    } catch (e) {
      if (e instanceof ApiProblem && e.code === 'VALIDATION_ERROR') { setErrors(e.fields); setProblem(null); }
      else { setProblem(e instanceof ApiProblem ? e : null); toast("Couldn't save the draft.", { error: true }); }
      return null;
    }
  }
  async function onSave() { setBusy('save'); await save(); setBusy(null); }
  async function onSubmit() {
    setBusy('submit');
    const saved = await save(true);
    if (saved) {
      try {
        await khidma.submit(r.id);
        navigate(`/applicant/requests/${r.id}/submitted`);
        return;
      } catch (e) {
        if (e instanceof ApiProblem && e.code === 'REQ_INCOMPLETE') { setErrors(e.fields); setProblem(null); }
        else { setErrors([]); setProblem(e instanceof ApiProblem ? e : null); }
        window.scrollTo?.({ top: 0, behavior: 'smooth' });
      }
    }
    setBusy(null);
  }

  const docs = declaredCount(r, draft);
  const detailErrors = errors.filter((e) => e.startsWith('formData.')).length;
  const missingFields = r.fields.filter((f) => !(draft.formData[f.name] ?? '').trim()).length;
  const detailsOk = missingFields === 0 && detailErrors === 0;
  const docsOk = docs.declared === docs.required && !errors.some((e) => e.startsWith('documents.'));

  return (
    <main className="k-main">
      <nav className="k-crumbs" aria-label="Breadcrumb"><Link to="/applicant">My requests</Link><Icon name="chevronRight" small /><span>New request</span></nav>
      <div className="k-page-head">
        <div className="k-stack-sm">
          <div className="k-row"><span className="k-tag k-mono">{r.service.code}</span><StatusBadge status="DRAFT" /></div>
          <h1 className="k-h1">{r.service.name}</h1>
          <p className="k-small k-muted">{savedAt ? `Draft saved ${fmtDateTime(savedAt)}` : 'Draft'} · No reference number until you submit</p>
        </div>
      </div>
      <div className="k-split">
        <div className="k-split-main">
          <ErrorSummary errors={errors} r={r} />
          {problem?.code === 'REQ_DUPLICATE_OPEN' && (
            <div className="k-alert k-alert-error" role="alert"><Icon name="alertCircle" /><div className="k-alert-body"><b>You already have an open {r.service.name.toLowerCase()}</b><span className="k-small">{problem.body.openReferenceNo ? <><span className="k-mono">{String(problem.body.openReferenceNo)}</span> is still open. </> : null}You can submit a new one after it is decided or withdrawn.</span></div></div>
          )}
          {problem && problem.code !== 'REQ_DUPLICATE_OPEN' && (
            <div className="k-alert k-alert-error" role="alert"><Icon name="alertCircle" /><div className="k-alert-body"><span className="k-small"><b>{problem.message}</b></span></div></div>
          )}
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title"><StepNumber n={1} size={26} />Request details</h2></div>
            <div className="k-card-body"><FieldsEditor r={r} draft={draft} onChange={setDraft} errors={errors} /></div>
          </section>
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title"><StepNumber n={2} size={26} />Declare documents</h2><span className="k-small k-muted">{docs.declared} of {docs.required} required declared</span></div>
            <div className="k-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p className="k-small k-muted" style={{ marginBottom: 8 }}>Enter the number printed on each document. You don't upload files. Required documents must be declared before you can submit.</p>
              <DocumentsEditor r={r} draft={draft} onChange={setDraft} errors={errors} />
            </div>
          </section>
          <div className="k-sticky-bar k-mobile-only">
            <button className="k-btn k-btn-secondary" type="button" onClick={onSave} disabled={busy !== null}>Save draft</button>
            <button className="k-btn k-btn-primary" type="button" onClick={onSubmit} disabled={busy !== null}>Submit request</button>
          </div>
        </div>
        <aside className="k-split-side">
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Ready to submit?</h2></div>
            <div className="k-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Check ok={detailsOk} title="Request details" text={detailsOk ? 'All fields filled' : `${missingFields || detailErrors} field${(missingFields || detailErrors) === 1 ? '' : 's'} need attention`} />
              <Check ok={docsOk} title="Documents" text={`${docs.declared} of ${docs.required} required declared`} />
              <Check ok title={`No other open ${r.service.name.toLowerCase()}`} text="Checked again when you submit" />
              <hr className="k-divider" />
              <div className="k-kv"><span>Processing time</span><span>{r.service.slaDays} working days</span></div>
              <div className="k-kv"><span>If submitted now, due</span><span>{fmtDate(r.dueIfSubmittedNow)}</span></div>
              <p className="k-xs k-muted">After you submit, the request is read-only unless the reviewer asks for information.</p>
            </div>
            <div className="k-card-foot k-desktop-only" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <button className={`k-btn k-btn-primary k-btn-block${busy === 'submit' ? ' is-loading' : ''}`} type="button" onClick={onSubmit} disabled={busy === 'save'} aria-busy={busy === 'submit'}>
                {busy === 'submit' && <span className="k-spin" />}{busy === 'submit' ? 'Submitting…' : 'Submit request'}
              </button>
              <button className="k-btn k-btn-secondary k-btn-block" type="button" onClick={onSave} disabled={busy !== null}>Save draft</button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Check({ ok, title, text }: { ok: boolean; title: string; text: string }) {
  return (
    <div className="k-row" style={{ gap: 10, alignItems: 'flex-start' }}>
      <span className="k-dialog-icon" style={{ width: 24, height: 24, ...(ok ? { background: '#E3F2E8', color: '#17663E' } : { background: '#FBE9E7', color: '#A3261C' }) }}><Icon name={ok ? 'check' : 'x'} small /></span>
      <span className="k-small" style={{ flex: 1 }}><b>{title}</b><br /><span className="k-muted">{text}</span></span>
    </div>
  );
}
