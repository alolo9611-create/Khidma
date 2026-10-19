import type { Role } from '../modules/accounts/users.repository.js';

// PQ-18: applicants see status-change entries with a role label (no staff names) and the notes of
// INFO_REQUESTED, REJECTED and responses; reassign-only entries are hidden. Staff see everything.
export interface ActivityView { action: string; fromStatus: string | null; toStatus: string | null; note: string | null; actorRole: Role; actorName: string }

const APPLICANT_NOTE_ACTIONS = new Set(['REQUEST_INFO', 'RESPOND', 'REJECT']);

export function timelineForApplicant<T extends ActivityView>(entries: T[]) {
  return entries
    .filter((e) => e.action !== 'REASSIGN')
    .map((e) => ({
      ...e,
      actorName: e.actorRole === 'APPLICANT' ? 'You' : e.actorRole === 'SUPERVISOR' ? 'Supervisor' : 'Reviewer',
      note: APPLICANT_NOTE_ACTIONS.has(e.action) ? e.note : null,
    }));
}

// PQ-19 (⛔ provisional): applicants post PUBLIC only on their own requests; staff post PUBLIC or INTERNAL.
// Applicants never receive INTERNAL comments. Allowed in every non-DRAFT state.
export function canPostComment(role: Role, visibility: 'PUBLIC' | 'INTERNAL', requestStatus: string): boolean {
  if (requestStatus === 'DRAFT') return false;
  return role === 'APPLICANT' ? visibility === 'PUBLIC' : true;
}
