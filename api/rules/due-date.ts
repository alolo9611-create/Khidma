import { addDays, fromLocal, localDate } from '../core/time.js';

// BR-11 + PQ-11: dueAt = 23:59:59.999 local time on the N-th working day after the submission day.
// Working days are Sunday–Thursday; the submission day is never counted, so a Friday or Saturday
// submission counts Sunday as day 1. No holiday calendar.
export function isWorkingDay(weekday: number): boolean {
  return weekday >= 0 && weekday <= 4; // Sun=0 … Thu=4
}

export function computeDueAt(submittedAt: Date, slaDays: number, tz: string): Date {
  if (!Number.isInteger(slaDays) || slaDays < 1) throw new Error(`slaDays must be a positive integer, got ${slaDays}`);
  let day = localDate(submittedAt, tz);
  let counted = 0;
  while (counted < slaDays) {
    day = addDays(day, 1);
    if (isWorkingDay(day.weekday)) counted += 1;
  }
  return fromLocal(day.year, day.month, day.day, 23, 59, 59, 999, tz);
}
