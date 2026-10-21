import { Link } from 'react-router-dom';
import type { Service } from '../api/khidma';
import { Icon } from '../ui/Icon';

// S-03 landing hero: the request → certificate journey (BR-01, BR-02/BR-11, BR-04/BR-07, BR-09/BR-17).
// Step previews are illustrations (aria-hidden) in the formats the app really uses.
const STEPS = [
  { title: 'Submit your request online', text: 'Enter the required document numbers. No file uploads.', preview: <FormPreview /> },
  { title: 'Get a reference and due date', text: 'A reference number and a due date counted in working days, Sunday to Thursday.', preview: <TicketPreview /> },
  { title: 'Answer questions in the app', text: 'If a reviewer needs more information, you are notified and can correct your request.', preview: <MessagePreview /> },
  { title: 'Receive the decision and certificate', text: 'A certificate number anyone can verify.', preview: <CertificatePreview /> },
];

export function CatalogHero({ services, canStart }: { services: Service[] | null; canStart: boolean }) {
  return (
    <section className="k-hero" aria-labelledby="k-hero-title">
      <HeroPattern />
      <div className="k-hero-inner">
        <span className="k-hero-eyebrow">Khidma · e-services of the General Authority for Civic Services</span>
        <div className="k-hero-top">
          <div className="k-hero-copy">
            <h1 id="k-hero-title" className="k-hero-title">From request to certificate,<span>in one clear path</span></h1>
            <p className="k-hero-lead">Apply for a licence or permit online and see where your request is at every step and when it will be done, without calling the office.</p>
            <div className="k-hero-actions">
              {canStart && <a className="k-btn k-hero-btn-primary" href="#services">Start a new request<Icon name="arrowRight" small /></a>}
              <Link className="k-btn k-hero-btn-outline" to="/verify">Verify a certificate</Link>
            </div>
          </div>
          {services && services.length > 0 && (
            <aside className="k-hero-aside">
              <b>{services.length} service{services.length === 1 ? '' : 's'} available</b>
              <span>{services.map((s) => s.name).join(', ')}.</span>
              <a href="#services">Browse them below</a>
            </aside>
          )}
        </div>
        <ol className="k-journey">
          {STEPS.map((s, i) => (
            <li key={s.title} className="k-journey-step">
              <span className="k-journey-n">{i + 1}</span>
              <div className="k-journey-card" aria-hidden="true">{s.preview}</div>
              <h2 className="k-journey-title">{s.title}</h2>
              <p className="k-journey-text">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FormPreview() {
  return (
    <div className="k-pv-form">
      <span className="k-pv-bar" />
      {['Lease contract no.', 'Commercial registration no.'].map((l) => <span key={l} className="k-pv-field"><span>{l}</span><span>••••••</span></span>)}
      <span className="k-pv-bar is-short" />
    </div>
  );
}

function TicketPreview() {
  return (
    <div className="k-pv-ticket">
      <span className="k-pv-label">Reference number</span>
      <span className="k-mono k-pv-ref">KH-2026-000131</span>
      <span className="k-pv-cut" />
      <span className="k-pv-row"><span className="k-pv-label">Due date</span><b>26 Oct 2026</b></span>
    </div>
  );
}

function MessagePreview() {
  return (
    <div className="k-pv-msg">
      <span className="k-pv-bubble">The reviewer needs more information about your request.</span>
      <span className="k-pv-chip">Correct and send reply</span>
      <span className="k-pv-note">In the app, no office visit</span>
    </div>
  );
}

function CertificatePreview() {
  return (
    <div className="k-pv-cert">
      <svg viewBox="0 0 40 40" className="k-pv-star"><path d={star(20, 20, 18, 12.5)} /></svg>
      <span className="k-mono k-pv-certno">SIGN-PMT-2026-00017</span>
      <span className="k-pv-note">Valid until 8 Oct 2027</span>
    </div>
  );
}

/** Eight-point star outline (the brand's geometric motif). */
function star(cx: number, cy: number, outer: number, inner: number) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${pts.join('L')}Z`;
}

function HeroPattern() {
  return (
    <svg className="k-hero-pattern" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="k-hero-stars" width="128" height="128" patternUnits="userSpaceOnUse">
          {[[64, 64], [0, 0], [128, 0], [0, 128], [128, 128]].map(([x, y]) => <path key={`${x}-${y}`} d={star(x, y, 52, 40)} />)}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#k-hero-stars)" />
    </svg>
  );
}
