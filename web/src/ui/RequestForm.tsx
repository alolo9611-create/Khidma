import type { FieldDef, RequestDetail } from '../api/khidma';
import { Icon } from './Icon';

export type Draft = { formData: Record<string, string>; documents: Record<string, string> };

export function draftFrom(r: RequestDetail): Draft {
  return {
    formData: Object.fromEntries(r.fields.map((f) => [f.name, r.formData[f.name] === undefined ? '' : String(r.formData[f.name])])),
    documents: Object.fromEntries(r.documents.map((d) => [d.typeCode, d.documentNumber ?? ''])),
  };
}

/** API body: integers as numbers, empty strings clear a value. */
export function toBody(r: RequestDetail, d: Draft) {
  const formData: Record<string, string | number | null> = {};
  for (const f of r.fields) {
    const v = d.formData[f.name]?.trim() ?? '';
    formData[f.name] = v === '' ? null : f.type === 'integer' && /^\d+$/.test(v) ? Number(v) : v;
  }
  const documents: Record<string, string | null> = {};
  for (const doc of r.documents) { const v = d.documents[doc.typeCode]?.trim() ?? ''; documents[doc.typeCode] = v === '' ? null : v; }
  return { formData, documents };
}

export function fieldMessage(key: string, r: RequestDetail): { anchor: string; text: string } {
  const [kind, name] = key.split('.');
  if (kind === 'documents') {
    const doc = r.documents.find((d) => d.typeCode === name);
    return { anchor: `doc-${name}`, text: `Enter the ${doc ? doc.label.toLowerCase() : name}.` };
  }
  const f = r.fields.find((x) => x.name === name);
  if (!f) return { anchor: 'form', text: 'Check the request details.' };
  return { anchor: `f-${name}`, text: fieldRule(f) };
}

function fieldRule(f: FieldDef): string {
  if (f.type === 'date') return `Enter ${f.label.toLowerCase()} (today or later).`;
  if (f.type === 'integer') return `Enter ${f.label.toLowerCase()} as a whole number from ${f.min} to ${f.max.toLocaleString('en')}.`;
  return `Enter ${f.label.toLowerCase()} (${f.min}–${f.max} characters).`;
}

export function ErrorSummary({ errors, r }: { errors: string[]; r: RequestDetail }) {
  if (!errors.length) return null;
  return (
    <div className="k-alert k-alert-error" role="alert">
      <Icon name="alertCircle" />
      <div className="k-alert-body">
        <b className="k-alert-title" style={{ color: '#A3261C' }}>You can't submit yet. {errors.length} item{errors.length === 1 ? ' needs' : 's need'} attention.</b>
        <ul style={{ margin: '2px 0 0', paddingLeft: 18 }} className="k-small">
          {errors.map((e) => { const m = fieldMessage(e, r); return <li key={e}><a href={`#${m.anchor}`}>{m.text}</a></li>; })}
        </ul>
      </div>
    </div>
  );
}

export function FieldsEditor({ r, draft, onChange, errors }: { r: RequestDetail; draft: Draft; onChange(d: Draft): void; errors: string[] }) {
  return (
    <div className="k-grid-2" id="form">
      {r.fields.map((f) => {
        const bad = errors.includes(`formData.${f.name}`);
        return (
          <div className={`k-field${bad ? ' is-error' : ''}`} key={f.name}>
            <label className="k-label" htmlFor={`f-${f.name}`}>{f.label}<span className="k-req">*</span></label>
            <input
              className="k-input" id={`f-${f.name}`} type={f.type === 'date' ? 'date' : f.type === 'integer' ? 'number' : 'text'}
              min={f.type === 'integer' ? f.min : undefined} max={f.type === 'integer' ? f.max : undefined} maxLength={f.type === 'text' ? f.max : undefined}
              value={draft.formData[f.name] ?? ''} onChange={(e) => onChange({ ...draft, formData: { ...draft.formData, [f.name]: e.target.value } })}
            />
            {bad ? <span className="k-err"><Icon name="alertCircle" small />{fieldMessage(`formData.${f.name}`, r).text}</span>
              : f.type === 'date' ? <span className="k-hint">Today or later.</span> : null}
          </div>
        );
      })}
    </div>
  );
}

export function DocumentsEditor({ r, draft, onChange, errors, previous }: { r: RequestDetail; draft: Draft; onChange(d: Draft): void; errors: string[]; previous?: Record<string, string | null> }) {
  return (
    <>
      {r.documents.map((d) => {
        const value = draft.documents[d.typeCode] ?? '';
        const bad = errors.includes(`documents.${d.typeCode}`);
        const changed = previous && (previous[d.typeCode] ?? '') !== value;
        return (
          <div className="k-doc" key={d.typeCode}>
            <span className={`k-doc-icon${bad ? ' is-missing' : value ? ' is-done' : ''}`}><Icon name={bad ? 'fileAlert' : value ? 'fileCheck' : 'fileText'} /></span>
            <div className={`k-field${bad ? ' is-error' : ''}`}>
              <div className="k-row" style={{ justifyContent: 'space-between' }}>
                <label className="k-label" htmlFor={`doc-${d.typeCode}`}>{d.label}{d.mandatory ? <span className="k-req">*</span> : <span className="k-opt"> (optional)</span>}</label>
                {changed && <span className="k-tag" style={{ background: '#E6F0ED', color: '#0E5A4B', borderColor: '#B7D3CA' }}>Changed</span>}
              </div>
              <input className="k-input k-mono" id={`doc-${d.typeCode}`} value={value} maxLength={40} style={{ fontFamily: 'var(--f-mono)', maxWidth: 420 }}
                onChange={(e) => onChange({ ...draft, documents: { ...draft.documents, [d.typeCode]: e.target.value } })} />
              {bad && <span className="k-err"><Icon name="alertCircle" small />{fieldMessage(`documents.${d.typeCode}`, r).text} Use letters, digits, - or / (up to 40).</span>}
              {changed && previous?.[d.typeCode] && <span className="k-hint">Previously <span className="k-mono">{previous[d.typeCode]}</span></span>}
              <span className="k-xs k-mono k-muted">{d.typeCode}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function declaredCount(r: RequestDetail, d: Draft) {
  const required = r.documents.filter((x) => x.mandatory);
  return { declared: required.filter((x) => (d.documents[x.typeCode] ?? '').trim()).length, required: required.length };
}
