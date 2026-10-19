import { useEffect, useState } from 'react';
import { ApiProblem } from '../api/http';
import { khidma, type Service } from '../api/khidma';
import { Icon } from '../ui/Icon';
import { LoadError, Skeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { useLoad } from '../ui/useLoad';

// S-12 (F-04, BR-11): supervisor edits slaDays (1–30) and the active flag of own department's services.
export function ServicesSettingsPage() {
  const list = useLoad(() => khidma.myServices(), []);
  if (list.error) return <main className="k-main is-narrow"><LoadError what="the services" onRetry={list.reload} /></main>;
  if (!list.data) return <main className="k-main is-narrow"><Skeleton /></main>;
  const dept = list.data[0]?.department.name ?? 'your';
  return (
    <main className="k-main is-narrow">
      <div className="k-page-head"><div className="k-stack-sm"><h1 className="k-h1">Service settings</h1><p className="k-muted">Processing time and availability for services owned by the {dept} department.</p></div></div>
      <div className="k-stack" style={{ gap: 20 }}>
        {list.data.map((s) => <ServiceCard key={s.id} s={s} onSaved={(u) => list.set(list.data!.map((x) => (x.id === u.id ? u : x)))} />)}
        <div className="k-alert k-alert-info"><Icon name="info" /><div className="k-alert-body"><span className="k-small">A new processing time applies to requests submitted after you save. Due dates already set are not recalculated, because the due date is fixed at submission.</span></div></div>
      </div>
    </main>
  );
}

function ServiceCard({ s, onSaved }: { s: Service; onSaved(s: Service): void }) {
  const toast = useToast();
  const [sla, setSla] = useState(String(s.slaDays));
  const [active, setActive] = useState(s.isActive);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSla(String(s.slaDays)); setActive(s.isActive); }, [s]);
  const n = Number(sla);
  const slaValid = /^\d+$/.test(sla) && n >= 1 && n <= 30;
  const dirty = sla !== String(s.slaDays) || active !== s.isActive;
  async function save() {
    if (!slaValid) { setError('Enter a whole number from 1 to 30.'); return; }
    setBusy(true); setError(null);
    try { onSaved(await khidma.updateService(s.id, { slaDays: n, isActive: active })); toast('Settings saved'); }
    catch (e) { setError(e instanceof ApiProblem ? e.message : 'Something went wrong. Try again in a moment.'); }
    finally { setBusy(false); }
  }
  return (
    <section className="k-card" style={dirty ? { borderColor: '#0E5A4B', boxShadow: '0 0 0 1px #0E5A4B' } : undefined}>
      <div className="k-card-head"><div className="k-row" style={{ gap: 10 }}><span className="k-tag k-mono">{s.code}</span><h2 className="k-h3">{s.name}</h2></div><span className={`k-badge ${s.isActive ? 'st-approved' : 'st-withdrawn'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></div>
      <div className="k-card-body" style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className={`k-field${error && !slaValid ? ' is-error' : ''}`} style={{ flex: '0 1 240px' }}>
          <label className="k-label" htmlFor={`sla-${s.id}`}>Processing time (working days)</label>
          <div className="k-row" style={{ gap: 8, flexWrap: 'nowrap' }}><input className="k-input" id={`sla-${s.id}`} type="number" min={1} max={30} value={sla} onChange={(e) => setSla(e.target.value)} style={{ width: 96 }} />{sla !== String(s.slaDays) && <span className="k-small k-muted">was {s.slaDays}</span>}</div>
          {error && !slaValid ? <span className="k-err"><Icon name="alertCircle" small />{error}</span> : <span className="k-hint">Between 1 and 30.</span>}
        </div>
        <div className="k-field" style={{ flex: '1 1 280px' }}>
          <span className="k-label">Availability</span>
          <label className="k-check"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span><b>Active</b><br /><span className="k-small k-muted">{active ? 'Shown in the public catalog and open for new requests.' : 'Hidden from the public catalog and closed for new requests. Requests already in progress continue.'}</span></span></label>
        </div>
      </div>
      {error && slaValid && <div className="k-card-body" style={{ paddingTop: 0 }}><div className="k-alert k-alert-error" role="alert"><Icon name="alertCircle" /><div className="k-alert-body"><span className="k-small">{error}</span></div></div></div>}
      <div className="k-card-foot" style={{ justifyContent: dirty ? 'space-between' : 'flex-end' }}>
        {dirty && <span className="k-small" style={{ color: '#7A4300', fontWeight: 600 }}>Unsaved changes</span>}
        <div className="k-row">
          {dirty && <button className="k-btn k-btn-secondary k-btn-sm" type="button" onClick={() => { setSla(String(s.slaDays)); setActive(s.isActive); setError(null); }}>Cancel</button>}
          <button className="k-btn k-btn-primary k-btn-sm" type="button" disabled={!dirty || busy} onClick={save}>Save changes</button>
        </div>
      </div>
    </section>
  );
}
