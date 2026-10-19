// PRD §03 request lifecycle.
export const REQUEST_STATUSES = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** In-flight statuses: "open" for BR-03 (DRAFT excluded, PQ-10 provisional), SLA scope (PQ-12), dashboard "open" (PQ-13). */
export const OPEN_STATUSES: readonly RequestStatus[] = ['SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED'];
/** Counted against a reviewer's load limit (BR-06, PQ-13). */
export const ACTIVE_STATUSES: readonly RequestStatus[] = ['IN_REVIEW', 'INFO_REQUESTED'];
export const DECIDED_STATUSES: readonly RequestStatus[] = ['APPROVED', 'REJECTED'];

export function isRequestStatus(s: unknown): s is RequestStatus {
  return typeof s === 'string' && (REQUEST_STATUSES as readonly string[]).includes(s);
}
