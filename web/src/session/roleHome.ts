import type { Role } from '../api/auth';

export function roleHome(role: Role): string {
  switch (role) {
    case 'APPLICANT': return '/applicant';
    case 'REVIEWER': return '/staff/review';
    case 'SUPERVISOR': return '/staff/supervisor';
  }
}
