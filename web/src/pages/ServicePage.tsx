import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiProblem } from '../api/http';
import { khidma, type MyRequestRow, type Service } from '../api/khidma';
import { useSession } from '../session/SessionContext';
import { Icon } from '../ui/Icon';
import { LoadError, NotFound, Skeleton } from '../ui/States';
import { startLink } from './CatalogPage';

const OPEN = ['SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED'];

// S-04 (F-03): public service detail; inactive or unknown services are "not found" (PQ-07).
export function ServicePage() {
  const { code = '' } = useParams();
  const { user } = useSession();
  const [service, setService] = useState<Service | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'failed'>('loading');
  const [openRequest, setOpenRequest] = useState<MyRequestRow | null>(null);
  const load = useCallback(() => {
    setState('loading');
    khidma.service(code).then((s) => { setService(s); setState('ok'); })
      .catch((e) => setState(e instanceof ApiProblem && e.status === 404 ? 'missing' : 'failed'));
  }, [code]);
  useEffect(load, [load]);
  // Duplicate warning (design): shown as information; the guard itself is enforced at submit (BR-03).
  useEffect(() => {
    if (user?.role !== 'APPLICANT' || !service || service.allowMultiple) return;
    khidma.myRequests().then((rows) => setOpenRequest(rows.find((r) => r.service.code === service.code && OPEN.includes(r.status)) ?? null)).catch(() => {});
  }, [user, service]);

  if (state === 'missing') return <NotFound />;
  if (state === 'failed') return <main className="k-main"><LoadError what="this service" onRetry={load} /></main>;
  if (!service) return <main className="k-main"><Skeleton /></main>;

  return (
    <main className="k-main">
      <nav className="k-crumbs" aria-label="Breadcrumb"><Link to="/catalog">Services</Link><Icon name="chevronRight" small /><span>{service.name}</span></nav>
      <div className="k-page-head">
        <div className="k-stack-sm"><span className="k-tag k-mono" style={{ alignSelf: 'flex-start' }}>{service.code}</span><h1 className="k-h1">{service.name}</h1></div>
      </div>
      <div className="k-split">
        <div className="k-split-main">
          <section className="k-card">
            <div className="k-card-head"><h2 className="k-section-title">Documents you will need</h2></div>
            <div className="k-card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {service.documents.map((d) => (
                <div className="k-doc" key={d.typeCode}>
                  <span className="k-doc-icon"><Icon name="fileText" /></span>
                  <div className="k-stack-sm" style={{ gap: 2 }}>
                    <div className="k-row" style={{ justifyContent: 'space-between' }}><b>{d.label}</b><span className="k-tag">{d.mandatory ? 'Required' : 'Optional'}</span></div>
                    <span className="k-small k-muted">You will enter the {d.label.toLowerCase()}.</span>
                    <span className="k-xs k-mono k-muted">{d.typeCode}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="k-card-foot" style={{ justifyContent: 'flex-start', background: '#EEF3FA', color: '#1D4F91' }}><Icon name="info" /><span className="k-small">No files are uploaded. You only enter the number printed on each document.</span></div>
          </section>
          <section className="k-card k-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className="k-section-title">What happens after you submit</h2>
            <ol className="k-timeline">
              {[
                ['You get a reference number and a due date', `For example KH-2026-000123, due ${service.slaDays} working days after submission.`],
                ['A reviewer picks up your request', 'Your request is read-only while it is in review.'],
                ['The reviewer may ask for information, up to 2 times', 'You are notified in the app and can correct your form and document numbers.'],
                ['You receive a decision', 'Approved: a certificate valid for 12 months. Rejected: the reason and an explanation.'],
              ].map(([t, m], i) => (
                <li className="k-tl-item" key={t}><span className={`k-tl-dot${i === 0 ? ' is-primary' : ''}`}><span className="k-xs k-strong">{i + 1}</span></span><div><div className="k-tl-title">{t}</div><div className="k-tl-meta">{m}</div></div></li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="k-split-side">
          <section className="k-card k-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="k-stack-sm" style={{ gap: 4 }}>
              <span className="k-eyebrow">Processing time</span>
              <span style={{ fontSize: 28, lineHeight: '36px', fontWeight: 700 }}>{service.slaDays} working days</span>
              <span className="k-small k-muted">Sunday to Thursday. Requests submitted on Friday or Saturday start counting on Sunday.</span>
            </div>
            <hr className="k-divider" />
            <div className="k-row" style={{ gap: 10, alignItems: 'flex-start' }}><Icon name="info" /><span className="k-small" style={{ flex: 1 }}>{service.allowMultiple ? 'You can have several open requests for this service.' : `You can have one open ${service.name.toLowerCase()} at a time.`}</span></div>
            {openRequest ? (
              <>
                <div className="k-alert k-alert-warn"><Icon name="alertTriangle" /><div className="k-alert-body"><span className="k-small">You already have an open request for this service: <Link className="k-mono" to={`/applicant/requests/${openRequest.id}`}>{openRequest.referenceNo}</Link>.</span></div></div>
                <Link className="k-btn k-btn-secondary k-btn-block" to={`/applicant/requests/${openRequest.id}`}>Go to open request</Link>
              </>
            ) : user?.role === 'APPLICANT' ? (
              <Link className="k-btn k-btn-primary k-btn-block" to={startLink(user, service.code)}>Start request</Link>
            ) : !user ? (
              <>
                <Link className="k-btn k-btn-primary k-btn-block" to="/login">Sign in to start a request</Link>
                <span className="k-xs k-muted" style={{ textAlign: 'center' }}>Applicants use the account provided by GACS.</span>
              </>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
