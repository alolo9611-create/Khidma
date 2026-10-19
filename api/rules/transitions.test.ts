import { describe, expect, it } from 'vitest';
import { ProblemError } from '../core/problem.js';
import { assertTransition, canTransition } from './transitions.js';

describe('request lifecycle (PRD §03)', () => {
  it('allows the seven transitions', () => {
    expect(assertTransition('T-01', 'DRAFT')).toBe('SUBMITTED');
    expect(assertTransition('T-02', 'SUBMITTED')).toBe('IN_REVIEW');
    expect(assertTransition('T-03', 'IN_REVIEW')).toBe('INFO_REQUESTED');
    expect(assertTransition('T-04', 'INFO_REQUESTED')).toBe('IN_REVIEW');
    expect(assertTransition('T-05', 'IN_REVIEW')).toBe('APPROVED');
    expect(assertTransition('T-06', 'IN_REVIEW')).toBe('REJECTED');
  });
  it('BR-10: withdraw only from SUBMITTED, IN_REVIEW and INFO_REQUESTED', () => {
    for (const s of ['SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED'] as const) expect(canTransition('T-07', s)).toBe(true);
    for (const s of ['DRAFT', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const) expect(canTransition('T-07', s)).toBe(false);
  });
  it('any other move is 409 INVALID_TRANSITION', () => {
    try { assertTransition('T-05', 'SUBMITTED'); throw new Error('no throw'); } catch (e) {
      expect(e).toBeInstanceOf(ProblemError);
      expect((e as ProblemError).status).toBe(409);
      expect((e as ProblemError).code).toBe('INVALID_TRANSITION');
    }
  });
});
