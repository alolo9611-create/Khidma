import { problem } from '../core/problem.js';
import type { RequestStatus } from './statuses.js';

// PRD §03: seven transitions. Any other move returns 409 INVALID_TRANSITION.
export type TransitionId = 'T-01' | 'T-02' | 'T-03' | 'T-04' | 'T-05' | 'T-06' | 'T-07';
export const TRANSITIONS: Record<TransitionId, { from: readonly RequestStatus[]; to: RequestStatus }> = {
  'T-01': { from: ['DRAFT'], to: 'SUBMITTED' },
  'T-02': { from: ['SUBMITTED'], to: 'IN_REVIEW' },
  'T-03': { from: ['IN_REVIEW'], to: 'INFO_REQUESTED' },
  'T-04': { from: ['INFO_REQUESTED'], to: 'IN_REVIEW' },
  'T-05': { from: ['IN_REVIEW'], to: 'APPROVED' },
  'T-06': { from: ['IN_REVIEW'], to: 'REJECTED' },
  'T-07': { from: ['SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED'], to: 'WITHDRAWN' }, // BR-10
};

export function canTransition(id: TransitionId, from: RequestStatus): boolean {
  return TRANSITIONS[id].from.includes(from);
}

export function assertTransition(id: TransitionId, from: RequestStatus): RequestStatus {
  if (!canTransition(id, from)) throw problem('INVALID_TRANSITION');
  return TRANSITIONS[id].to;
}
