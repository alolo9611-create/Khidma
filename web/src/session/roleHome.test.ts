import { describe, expect, it } from 'vitest';
import { roleHome } from './roleHome';

describe('roleHome', () => {
  it.each([
    ['APPLICANT', '/applicant'],
    ['REVIEWER', '/staff/review'],
    ['SUPERVISOR', '/staff/supervisor'],
  ] as const)('maps %s to %s', (role, path) => {
    expect(roleHome(role)).toBe(path);
  });
});
