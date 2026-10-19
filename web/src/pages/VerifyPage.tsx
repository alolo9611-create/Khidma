import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiProblem } from '../api/http';
import { khidma, type Verification } from '../api/khidma';
import { fmtIsoDay } from '../ui/format';
import { Icon } from '../ui/Icon';

// S-02 (F-22, BR-17): service, valid/expired and dates only — no personal data.
export function VerifyPage() {
  const { certificateNo = '' } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(certificateNo);
  const [state, setState] = useState<{ kind: 'idle' | 'loading' | 'missing' | 'error' | 'empty' } | { kind: 'found'; v: Verification }>({ kind: 'idle' });
  useEffect(() => {
    setInput(certificateNo);
    if (!certificateNo) { setState({ kind: 'idle' }); return; }
    setState({ kind: 'loading' });
    khidma.verify(certificateNo).then((v) => setState({ kind: 'found', v }))
      .catch((e) => setState({ kind: e instanceof ApiProblem && e.status === 404 ? 'missing' : 'error' }));
  }, [certificateNo]);
  const fromQuery = query.get('no');
  if (!certificateNo && fromQuery) return <Navigate to={`/verify/${encodeURIComponent(fromQuery.trim().toUpperCase())}`} replace />; // HANDOFF: /verify?no=

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const no = input.trim();
    if (!no) { setState({ kind: 'empty' }); return; }
    navigate(`/verify/${encodeURIComponent(no.toUpperCase())}`);
  }
  return (
    <main className="k-main" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 48 }}>
      <div className="k-stack-sm" style={{ gap: 8 }}>
        <span className="k-dialog-icon" style={{ background: '#E6F0ED', color: '#0E5A4B', width: 48, height: 48 }}><Icon name="checkCircle" /></span>
        <h1 className="k-h1">Verify a certificate</h1>
        <p className="k-muted">Check that a GACS certificate is genuine and still valid. Anyone can use this page. No personal information is shown.</p>
      </div>
      <form className="k-card k-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={onSubmit} noValidate>
        <div className={`k-field${state.kind === 'empty' ? ' is-error' : ''}`}>
          <label className="k-label" htmlFor="cert">Certificate number</label>
          <div className="k-input-group" style={{ flexWrap: 'wrap' }}>
            <input className="k-input k-mono" id="cert" value={input} onChange={(e) => setInput(e.target.value)} placeholder="SHOP-LIC-2026-00042" style={{ flex: '1 1 260px', fontFamily: 'var(--f-mono)' }} />
            <button className="k-btn k-btn-primary" type="submit"><Icon name="search" />Verify</button>
          </div>
          {state.kind === 'empty' ? <span className="k-err">Enter a certificate number.</span> : <span className="k-hint">Printed on the certificate, for example SHOP-LIC-2026-00042.</span>}
        </div>
      </form>
      <div aria-live="polite">
        {state.kind === 'loading' && <div className="k-card k-card-pad"><div className="k-row"><span className="k-spin" style={{ animation: 'k-spin .8s linear infinite' }} /><span className="k-small k-muted">Checking the certificate…</span></div></div>}
        {state.kind === 'missing' && (
          <section className="k-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px 24px' }}>
              <span className="k-dialog-icon" style={{ background: '#F0F2EF', color: '#4E5C57' }}><Icon name="search" /></span>
              <div><div className="k-h3">Certificate not found</div><div className="k-small k-muted">No certificate matches <span className="k-mono">{certificateNo}</span>. Check the number and try again.</div></div>
            </div>
          </section>
        )}
        {state.kind === 'error' && <div className="k-alert k-alert-error" role="alert"><Icon name="alertCircle" /><div className="k-alert-body"><span className="k-small">Something went wrong. Try again in a moment.</span></div></div>}
        {state.kind === 'found' && (state.v.status === 'VALID' ? (
          <section className="k-card" style={{ overflow: 'hidden', borderColor: '#A9D5B8' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px 24px', background: '#EEF7F1', borderBottom: '1px solid #A9D5B8', flexWrap: 'wrap' }}>
              <span className="k-dialog-icon" style={{ background: '#17663E', color: '#fff' }}><Icon name="check" /></span>
              <div style={{ flex: 1, minWidth: 200 }}><div className="k-h2" style={{ color: '#17663E' }}>Valid certificate</div><div className="k-small k-muted">This certificate was issued by GACS and has not expired.</div></div>
            </div>
            <Details v={state.v} />
          </section>
        ) : (
          <section className="k-card" style={{ overflow: 'hidden', borderColor: '#EDCB8F' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px 24px', background: '#FDF5E6', borderBottom: '1px solid #EDCB8F', flexWrap: 'wrap' }}>
              <span className="k-dialog-icon" style={{ background: '#FCEFD9', color: '#8A4B00' }}><Icon name="clock" /></span>
              <div style={{ flex: 1, minWidth: 200 }}><div className="k-h2" style={{ color: '#7A4300' }}>Expired certificate</div><div className="k-small k-muted">Genuine, but no longer valid.</div></div>
            </div>
            <Details v={state.v} />
          </section>
        ))}
      </div>
    </main>
  );
}

function Details({ v }: { v: Verification }) {
  return (
    <dl className="k-dl" style={{ padding: 24 }}>
      <div><dt>Certificate number</dt><dd className="k-mono">{v.certificateNo}</dd></div>
      <div><dt>Service</dt><dd>{v.service.name}</dd></div>
      <div><dt>Issued on</dt><dd>{fmtIsoDay(v.issuedOn)}</dd></div>
      {v.status === 'VALID'
        ? <div><dt>Valid until</dt><dd>{fmtIsoDay(v.validUntil)}</dd></div>
        : <div><dt>Expired on</dt><dd>{fmtIsoDay(dayAfter(v.validUntil))}</dd></div>}
    </dl>
  );
}

/** The certificate expires the day after its last valid day (PQ-21). */
function dayAfter(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
