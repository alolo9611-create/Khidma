import { Link, useParams } from 'react-router-dom';
import { khidma } from '../api/khidma';
import { fmtDate, fmtDateTime } from '../ui/format';
import { Icon } from '../ui/Icon';
import { LoadError, Skeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { useLoad } from '../ui/useLoad';

// S-06 (F-07): confirmation with the reference number (BR-02) and due date (BR-11).
export function SubmittedPage() {
  const id = Number(useParams().id);
  const req = useLoad(() => khidma.request(id), [id]);
  const toast = useToast();
  if (req.error) return <main className="k-main"><LoadError what="this request" onRetry={req.reload} /></main>;
  if (!req.data) return <main className="k-main is-narrow"><Skeleton /></main>;
  const r = req.data;
  return (
    <main className="k-main is-narrow" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 48 }}>
      <section className="k-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '36px 32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <span className="k-dialog-icon" style={{ width: 56, height: 56, background: '#E3F2E8', color: '#17663E' }}><Icon name="check" style={{ width: 28, height: 28 }} /></span>
          <h1 className="k-h1">Request submitted</h1>
          <p className="k-muted" style={{ maxWidth: 480 }}>Your {r.service.name.toLowerCase()} is in the review queue. Keep your reference number to follow up.</p>
          <div style={{ marginTop: 8, padding: '16px 24px', border: '1px dashed #BFC8C3', borderRadius: 12, background: '#F5F6F4', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <span className="k-eyebrow">Reference number</span>
            <div className="k-row" style={{ gap: 12 }}>
              <span className="k-mono" style={{ fontSize: 28, lineHeight: '36px', fontWeight: 600, letterSpacing: '.02em' }}>{r.referenceNo}</span>
              <button className="k-icon-btn" type="button" aria-label="Copy reference number" onClick={() => { void navigator.clipboard?.writeText(r.referenceNo ?? ''); toast('Reference number copied'); }}><Icon name="copy" /></button>
            </div>
          </div>
        </div>
        <dl className="k-dl" style={{ padding: '20px 32px', borderTop: '1px solid #DDE2DE', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div><dt>Service</dt><dd>{r.service.name}</dd></div>
          <div><dt>Submitted</dt><dd>{fmtDateTime(r.submittedAt)}</dd></div>
          <div><dt>Decision due by</dt><dd className="k-strong">{fmtDate(r.dueAt)}</dd></div>
        </dl>
        <div className="k-card-foot" style={{ justifyContent: 'center' }}>
          <Link className="k-btn k-btn-secondary" to="/applicant">Back to my requests</Link>
          <Link className="k-btn k-btn-primary" to={`/applicant/requests/${r.id}`}>View request</Link>
        </div>
      </section>
      <section className="k-card k-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="k-h3">What happens next</h2>
        <div className="k-row" style={{ gap: 12, alignItems: 'flex-start' }}><Icon name="bell" style={{ color: '#0E5A4B' }} /><span style={{ flex: 1 }}>You'll get a notification here in Khidma every time the status changes. There are no emails or text messages.</span></div>
        <div className="k-row" style={{ gap: 12, alignItems: 'flex-start' }}><Icon name="lock" style={{ color: '#0E5A4B' }} /><span style={{ flex: 1 }}>Your request is now read-only. If the reviewer needs something, you'll be able to edit it then.</span></div>
        <div className="k-row" style={{ gap: 12, alignItems: 'flex-start' }}><Icon name="undo" style={{ color: '#0E5A4B' }} /><span style={{ flex: 1 }}>You can withdraw the request at any time before a decision.</span></div>
      </section>
    </main>
  );
}
