import { useEffect, useState } from 'react';
import { khidma, type Reviewer } from '../api/khidma';
import { Dialog } from './Dialog';
import { firstName, initials } from './format';

/** D-4: assign / reassign (BR-05; supervisors may assign above the limit, BR-06). */
export function AssignDialog({ referenceNo, statusText, currentAssigneeId, onClose, onAssign }: {
  referenceNo: string; statusText: string; currentAssigneeId: number | null; onClose(): void; onAssign(reviewerId: number): Promise<void>;
}) {
  const [reviewers, setReviewers] = useState<Reviewer[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { khidma.reviewers().then(setReviewers).catch(() => setReviewers([])); }, []);
  const chosen = reviewers?.find((r) => r.id === selected);
  const reassign = currentAssigneeId !== null;
  return (
    <Dialog title={reassign ? 'Reassign request' : 'Assign request'} icon="userPlus" tone="primary" onClose={onClose}
      subtitle={<><span className="k-mono">{referenceNo}</span> · {statusText}</>}
      footer={<>
        <button className="k-btn k-btn-secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="k-btn k-btn-primary" type="button" disabled={!chosen || busy} onClick={async () => { setBusy(true); try { await onAssign(chosen!.id); } finally { setBusy(false); } }}>
          {chosen ? `${reassign ? 'Reassign' : 'Assign'} to ${firstName(chosen.name)}` : reassign ? 'Reassign' : 'Assign'}
        </button>
      </>}>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <legend className="k-label" style={{ marginBottom: 8 }}>Reviewer</legend>
        {!reviewers ? <span className="k-skel" style={{ width: '60%' }} /> : reviewers.filter((r) => r.id !== currentAssigneeId).map((r) => {
          const pct = Math.min(100, Math.round((r.active / r.limit) * 100));
          return (
            <label key={r.id} className={`k-radio-card${selected === r.id ? ' is-on' : ''}`} style={{ alignItems: 'center' }}>
              <input type="radio" name="rv" checked={selected === r.id} onChange={() => setSelected(r.id)} style={{ margin: 0 }} />
              <span className="k-avatar">{initials(r.name)}</span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="k-row" style={{ justifyContent: 'space-between' }}><b className="k-small">{r.name}</b><span className="k-mono k-small">{r.active} / {r.limit} active</span></span>
                <span className={`k-meter${r.active >= r.limit ? ' is-full' : pct >= 80 ? ' is-high' : ''}`}><span style={{ width: `${pct}%` }} /></span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <p className="k-small k-muted">{reassign ? 'The status stays the same and the new reviewer is notified.' : `The request moves to In review and ${chosen ? firstName(chosen.name) : 'the reviewer'} is notified.`} You can assign above the limit of {reviewers?.[0]?.limit ?? 10} if needed.</p>
    </Dialog>
  );
}
