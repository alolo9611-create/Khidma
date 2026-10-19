import type { ActivityEntry, CommentEntry } from '../api/khidma';
import { fmtDateTime, fmtShort, initials, ROLE_LABEL, STATUS_LABEL } from './format';
import { Icon, type IconName } from './Icon';
import type { RequestStatus } from '../api/khidma';

const TITLE: Record<string, string> = {
  SUBMIT: 'Submitted', PICK: 'Picked up for review', ASSIGN: 'Assigned for review', REASSIGN: 'Reassigned',
  REQUEST_INFO: 'Information requested', RESPOND: 'Applicant responded', APPROVE: 'Approved', REJECT: 'Rejected', WITHDRAW: 'Withdrawn',
};
const DOT: Record<string, [IconName, string]> = {
  SUBMIT: ['send', 'is-primary'], PICK: ['userCheck', ''], ASSIGN: ['userPlus', ''], REASSIGN: ['userPlus', ''],
  REQUEST_INFO: ['message', 'is-info'], RESPOND: ['send', ''], APPROVE: ['check', 'is-ok'], REJECT: ['x', 'is-bad'], WITHDRAW: ['undo', ''],
};
const label = (s: string | null) => (s ? STATUS_LABEL[s as RequestStatus] ?? s : '');

/** BR-15 activity, newest first as in the artboards. */
export function Timeline({ entries }: { entries: ActivityEntry[] }) {
  if (!entries.length) return <p className="k-small k-muted">No activity yet.</p>;
  return (
    <ol className="k-timeline">
      {[...entries].reverse().map((e) => {
        const [icon, cls] = DOT[e.action] ?? ['info', ''];
        return (
          <li className="k-tl-item" key={e.id}>
            <span className={`k-tl-dot ${cls}`}><Icon name={icon} small /></span>
            <div>
              <div className="k-tl-title">{TITLE[e.action] ?? e.action}</div>
              <div className="k-tl-meta">{e.actorName} · {fmtDateTime(e.at)}</div>
              {e.fromStatus && e.toStatus && e.fromStatus !== e.toStatus && <div className="k-tl-meta">{label(e.fromStatus)} → {label(e.toStatus)}</div>}
              {e.note && <div className="k-tl-note">{e.note}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function CommentList({ comments }: { comments: CommentEntry[] }) {
  return (
    <>
      {comments.map((c) => (
        <div className="k-comment" key={c.id}>
          <span className="k-avatar" style={c.visibility === 'INTERNAL' ? { background: '#FCEFD9', color: '#7A4300' } : undefined}>{initials(c.authorName)}</span>
          <div className={`k-comment-bubble${c.visibility === 'INTERNAL' ? ' is-internal' : ''}`}>
            <div className="k-comment-head">
              <b>{c.authorName}</b>
              {c.visibility === 'INTERNAL'
                ? <span className="k-tag k-tag-internal"><Icon name="lock" small />Internal · staff only</span>
                : <span className="k-tag">{ROLE_LABEL[c.authorRole]}</span>}
              <span className="k-xs k-muted">{fmtShort(c.createdAt)}</span>
            </div>
            {c.body}
          </div>
        </div>
      ))}
    </>
  );
}
