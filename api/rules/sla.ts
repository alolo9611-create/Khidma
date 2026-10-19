import { addDays, fromLocal, localDate } from '../core/time.js';
import { isWorkingDay } from './due-date.js';
import { OPEN_STATUSES, type RequestStatus } from './statuses.js';

// BR-12 + PQ-12: computed when read. ON_TRACK, AT_RISK (≤ 1 working day of working time left),
// OVERDUE (strictly after dueAt and not decided). Only in-flight requests have an SLA status;
// WITHDRAWN has none (⛔ PQ-12 provisional).
export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Working milliseconds (Sun–Thu time only) between now and dueAt. */
export function workingMsUntil(now: Date, dueAt: Date, tz: string): number {
  if (now >= dueAt) return 0;
  let total = 0;
  let day = localDate(now, tz);
  for (let i = 0; i < 400; i++) {
    const start = fromLocal(day.year, day.month, day.day, 0, 0, 0, 0, tz);
    const end = new Date(fromLocal(day.year, day.month, day.day, 23, 59, 59, 999, tz).getTime() + 1);
    if (isWorkingDay(day.weekday)) {
      const a = Math.max(start.getTime(), now.getTime());
      const b = Math.min(end.getTime(), dueAt.getTime());
      if (b > a) total += b - a;
    }
    if (end >= dueAt) break;
    day = addDays(day, 1);
  }
  return total;
}

export function slaStatus(status: RequestStatus, dueAt: Date | null, now: Date, tz: string): SlaStatus | null {
  if (!dueAt || !OPEN_STATUSES.includes(status)) return null;
  if (now.getTime() > dueAt.getTime()) return 'OVERDUE';
  return workingMsUntil(now, dueAt, tz) <= DAY_MS ? 'AT_RISK' : 'ON_TRACK';
}

// BR-13: OVERDUE first, then AT_RISK, then dueAt ascending.
const RANK: Record<string, number> = { OVERDUE: 0, AT_RISK: 1, ON_TRACK: 2 };
export function compareForQueue(
  a: { sla: SlaStatus | null; dueAt: string | null; id: number },
  b: { sla: SlaStatus | null; dueAt: string | null; id: number },
): number {
  const ra = a.sla ? RANK[a.sla] : 3;
  const rb = b.sla ? RANK[b.sla] : 3;
  if (ra !== rb) return ra - rb;
  if (a.dueAt && b.dueAt && a.dueAt !== b.dueAt) return a.dueAt < b.dueAt ? -1 : 1;
  if (a.dueAt && !b.dueAt) return -1;
  if (!a.dueAt && b.dueAt) return 1;
  return a.id - b.id;
}
