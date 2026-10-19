import { describe, expect, it } from 'vitest';
import { canView } from './access.js';
import { codePoints, boundedText } from './text.js';
import { canPostComment, timelineForApplicant } from './visibility.js';

describe('access (BR-18)', () => {
  const rec = { applicantId: 1, departmentId: 1 };
  it('applicants see only their own requests; staff only their department', () => {
    expect(canView({ id: 1, name: '', email: '', role: 'APPLICANT', departmentId: null }, rec)).toBe(true);
    expect(canView({ id: 2, name: '', email: '', role: 'APPLICANT', departmentId: null }, rec)).toBe(false);
    expect(canView({ id: 3, name: '', email: '', role: 'REVIEWER', departmentId: 1 }, rec)).toBe(true);
    expect(canView({ id: 5, name: '', email: '', role: 'REVIEWER', departmentId: 2 }, rec)).toBe(false);
  });
});

describe('applicant timeline (PQ-18)', () => {
  it('uses role labels, hides reassign entries and staff-only notes', () => {
    const t = timelineForApplicant([
      { action: 'PICK', fromStatus: 'SUBMITTED', toStatus: 'IN_REVIEW', note: null, actorRole: 'REVIEWER' as const, actorName: 'Noura Demo' },
      { action: 'REASSIGN', fromStatus: 'IN_REVIEW', toStatus: 'IN_REVIEW', note: null, actorRole: 'SUPERVISOR' as const, actorName: 'Khalid Demo' },
      { action: 'REQUEST_INFO', fromStatus: 'IN_REVIEW', toStatus: 'INFO_REQUESTED', note: 'Please fix the lease number.', actorRole: 'REVIEWER' as const, actorName: 'Noura Demo' },
    ]);
    expect(t.map((e) => e.actorName)).toEqual(['Reviewer', 'Reviewer']);
    expect(t[1].note).toBe('Please fix the lease number.');
  });
});

describe('comments (PQ-19)', () => {
  it('applicants post PUBLIC only; nobody comments on a draft', () => {
    expect(canPostComment('APPLICANT', 'PUBLIC', 'IN_REVIEW')).toBe(true);
    expect(canPostComment('APPLICANT', 'INTERNAL', 'IN_REVIEW')).toBe(false);
    expect(canPostComment('REVIEWER', 'INTERNAL', 'APPROVED')).toBe(true);
    expect(canPostComment('REVIEWER', 'PUBLIC', 'DRAFT')).toBe(false);
  });
});

describe('text rules (BR-07, BR-08, PQ-16)', () => {
  it('trims and counts code points', () => {
    expect(codePoints('أهلا')).toBe(4);
    expect(boundedText('   short   ', 20)).toBeNull();
    expect(boundedText('  ' + 'x'.repeat(20) + '  ', 20)).toBe('x'.repeat(20));
    expect(boundedText('x'.repeat(1001), 1)).toBeNull();
  });
});
