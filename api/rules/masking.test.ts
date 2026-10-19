import { describe, expect, it } from 'vitest';
import { maskNationalId, nationalIdFor } from './masking.js';

describe('national ID masking (BR-16)', () => {
  it('masks as ******1234', () => {
    expect(maskNationalId('0000001234')).toBe('******1234');
  });
  it('shows the raw value only to the applicant and the assigned reviewer', () => {
    const ctx = { applicantId: 1, assigneeId: 3 };
    expect(nationalIdFor('0000000001', 1, ctx)).toBe('0000000001');
    expect(nationalIdFor('0000000001', 3, ctx)).toBe('0000000001');
    expect(nationalIdFor('0000000001', 6, ctx)).toBe('******0001'); // supervisor
    expect(nationalIdFor('0000000001', 4, { applicantId: 1, assigneeId: null })).toBe('******0001');
  });
});
