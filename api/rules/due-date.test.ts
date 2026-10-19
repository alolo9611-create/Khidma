import { describe, expect, it } from 'vitest';
import { computeDueAt } from './due-date.js';

const TZ = 'Asia/Riyadh';
const at = (iso: string) => new Date(iso);

// BR-11 + PQ-11: end of the N-th working day (Sun–Thu) after the submission day, local time.
describe('computeDueAt (BR-11)', () => {
  it('Sunday 10:00 + 5 working days → next Sunday 23:59:59.999 local', () => {
    expect(computeDueAt(at('2026-10-18T07:00:00Z'), 5, TZ).toISOString()).toBe('2026-10-25T20:59:59.999Z');
  });
  it('Thursday and Friday submissions get the same due date (Fri/Sat count Sunday as day 1)', () => {
    const thu = computeDueAt(at('2026-10-22T07:00:00Z'), 5, TZ).toISOString();
    const fri = computeDueAt(at('2026-10-23T07:00:00Z'), 5, TZ).toISOString();
    const sat = computeDueAt(at('2026-10-24T20:00:00Z'), 5, TZ).toISOString();
    expect(thu).toBe('2026-10-29T20:59:59.999Z');
    expect(fri).toBe(thu);
    expect(sat).toBe(thu);
  });
  it('skips Friday and Saturday inside the window', () => {
    // Wednesday + 3 → Thu(1), Sun(2), Mon(3)
    expect(computeDueAt(at('2026-10-21T07:00:00Z'), 3, TZ).toISOString()).toBe('2026-10-26T20:59:59.999Z');
  });
  it('uses the local day, not the UTC day (23:30 Riyadh Thursday is still Thursday)', () => {
    expect(computeDueAt(at('2026-10-22T20:30:00Z'), 1, TZ).toISOString()).toBe('2026-10-25T20:59:59.999Z');
  });
  it('rejects a non-positive SLA', () => {
    expect(() => computeDueAt(at('2026-10-18T07:00:00Z'), 0, TZ)).toThrow();
  });
});
