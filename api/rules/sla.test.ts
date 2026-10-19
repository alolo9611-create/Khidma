import { describe, expect, it } from 'vitest';
import { compareForQueue, slaStatus } from './sla.js';

const TZ = 'Asia/Riyadh';
const due = new Date('2026-10-25T20:59:59.999Z'); // Sunday 25 Oct, end of day local

describe('slaStatus (BR-12, PQ-12)', () => {
  it('ON_TRACK with more than one working day left', () => {
    expect(slaStatus('IN_REVIEW', due, new Date('2026-10-22T07:00:00Z'), TZ)).toBe('ON_TRACK');
  });
  it('AT_RISK during the last working day, including over the weekend before a Sunday due date', () => {
    expect(slaStatus('IN_REVIEW', due, new Date('2026-10-25T07:00:00Z'), TZ)).toBe('AT_RISK');
    expect(slaStatus('SUBMITTED', due, new Date('2026-10-24T07:00:00Z'), TZ)).toBe('AT_RISK'); // Saturday: only Sunday left
  });
  it('AT_RISK at exactly dueAt; OVERDUE strictly after', () => {
    expect(slaStatus('INFO_REQUESTED', due, due, TZ)).toBe('AT_RISK');
    expect(slaStatus('INFO_REQUESTED', due, new Date(due.getTime() + 1), TZ)).toBe('OVERDUE');
  });
  it('no SLA status for draft, decided or withdrawn requests', () => {
    const late = new Date('2026-11-30T07:00:00Z');
    for (const s of ['DRAFT', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const) expect(slaStatus(s, due, late, TZ)).toBeNull();
  });
});

describe('compareForQueue (BR-13)', () => {
  it('sorts OVERDUE, then AT_RISK, then dueAt ascending', () => {
    const rows = [
      { id: 1, sla: 'ON_TRACK' as const, dueAt: '2026-10-28T20:59:59.999Z' },
      { id: 2, sla: 'ON_TRACK' as const, dueAt: '2026-10-27T20:59:59.999Z' },
      { id: 3, sla: 'AT_RISK' as const, dueAt: '2026-10-19T20:59:59.999Z' },
      { id: 4, sla: 'OVERDUE' as const, dueAt: '2026-10-15T20:59:59.999Z' },
    ];
    expect(rows.sort(compareForQueue).map((r) => r.id)).toEqual([4, 3, 2, 1]);
  });
});
