import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { khidma, type Service } from '../api/khidma';
import { useSession } from '../session/SessionContext';
import { Icon } from '../ui/Icon';
import { Empty, LoadError, Skeleton } from '../ui/States';
import { CatalogHero } from './CatalogHero';

// S-03 (F-03): public catalog of active services.
export function startLink(user: ReturnType<typeof useSession>['user'], code: string) {
  return user?.role === 'APPLICANT' ? `/applicant/requests/new/${code}` : '/login';
}

export function CatalogPage() {
  const { user } = useSession();
  const [services, setServices] = useState<Service[] | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => { setFailed(false); khidma.services().then(setServices).catch(() => setFailed(true)); }, []);
  useEffect(load, [load]);
  const canStart = !user || user.role === 'APPLICANT';

  return (
    <>
      <CatalogHero services={services} canStart={canStart} />
      <main className="k-main k-catalog-main" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <span className="k-journey-start">Your journey starts by choosing a service</span>
        <section id="services" style={{ display: 'flex', flexDirection: 'column', gap: 16, scrollMarginTop: 24 }}>
          <div className="k-row" style={{ justifyContent: 'space-between' }}>
            <h2 className="k-h2">Services</h2>
            {services && <span className="k-small k-muted">{services.length} service{services.length === 1 ? '' : 's'} available</span>}
          </div>
          {failed ? <LoadError what="the services" onRetry={load} /> : !services ? <Skeleton /> : services.length === 0 ? (
            <Empty icon="list" title="No services are available right now" text="Please check back later." />
          ) : (
            <div className="k-grid-cards">
              {services.map((s) => (
                <article className="k-card" key={s.code} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="k-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                    <div className="k-row" style={{ justifyContent: 'space-between' }}>
                      <span className="k-tag k-mono">{s.code}</span>
                      <span className="k-row k-small k-muted" style={{ gap: 6 }}><Icon name="clock" small />{s.slaDays} working days</span>
                    </div>
                    <h3 className="k-h2">{s.name}</h3>
                    <div className="k-stack-sm" style={{ gap: 6 }}>
                      <span className="k-eyebrow">You will need</span>
                      <ul className="k-muted" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: '22px' }}>
                        {s.documents.map((d) => <li key={d.typeCode}>{d.label}{d.mandatory ? '' : ' (optional)'}</li>)}
                      </ul>
                    </div>
                    {s.allowMultiple
                      ? <span className="k-small" style={{ color: '#17663E', fontWeight: 600 }}>Several open requests allowed</span>
                      : <span className="k-small k-muted">One open request at a time</span>}
                  </div>
                  <div className="k-card-foot" style={{ justifyContent: 'space-between' }}>
                    <Link to={`/catalog/${s.code}`} className="k-strong">View details</Link>
                    {canStart && <Link className="k-btn k-btn-primary k-btn-sm" to={startLink(user, s.code)}>Start request</Link>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export function StepNumber({ n, size = 32 }: { n: number; size?: number }) {
  return <span className="k-step-n" style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#E6F0ED', color: '#0E5A4B', fontWeight: 700, border: 0 }}>{n}</span>;
}
