import type { RequestStatus, SlaStatus } from '../api/khidma';

// Display in the configured timezone (HANDOFF Q-21: "18 Oct 2026, 10:42", Asia/Riyadh).
const TZ = 'Asia/Riyadh';
const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' });

export const fmtDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const fmtDateTime = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)).replace(' at ', ', ') : '—');
export const fmtShort = (iso: string | null | undefined) => (iso ? shortFmt.format(new Date(iso)).replace(' at ', ', ') : '—');
export const fmtDayMonth = (iso: string | null | undefined) => (iso ? dayMonthFmt.format(new Date(iso)) : '—');
/** Calendar dates from the API (YYYY-MM-DD) are already local. */
export const fmtIsoDay = (d: string | null | undefined) => (d ? dateFmt.format(new Date(`${d}T12:00:00Z`)) : '—');

export const STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', IN_REVIEW: 'In review', INFO_REQUESTED: 'Info requested',
  APPROVED: 'Approved', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
};
export const STATUS_CLASS: Record<RequestStatus, string> = {
  DRAFT: 'st-draft', SUBMITTED: 'st-submitted', IN_REVIEW: 'st-review', INFO_REQUESTED: 'st-info',
  APPROVED: 'st-approved', REJECTED: 'st-rejected', WITHDRAWN: 'st-withdrawn',
};
export const SLA_LABEL: Record<SlaStatus, string> = { ON_TRACK: 'On track', AT_RISK: 'At risk', OVERDUE: 'Overdue' };
export const REJECT_REASON_LABEL: Record<string, string> = {
  DOC_INVALID: 'Document invalid', NOT_ELIGIBLE: 'Not eligible', DUPLICATE: 'Duplicate', OTHER: 'Other',
};
export const ROLE_LABEL = { APPLICANT: 'Applicant', REVIEWER: 'Reviewer', SUPERVISOR: 'Supervisor' } as const;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}
export const firstName = (name: string) => name.trim().split(/\s+/)[0];
export const daysLeftText = (n: number | null) => (n === null ? '' : n === 0 ? 'Past due' : `${n} working day${n === 1 ? '' : 's'} left`);
