import { problem } from '../core/problem.js';
import type { PublicUser } from '../modules/accounts/users.repository.js';

// BR-18: "Applicants see only their own requests; staff see only their department's. Anything else returns 403."
export interface ScopedRecord { applicantId: number; departmentId: number }

export function canView(user: PublicUser, rec: ScopedRecord & { status?: string }): boolean {
  if (user.role === 'APPLICANT') return user.id === rec.applicantId;
  if (rec.status === 'DRAFT') return false; // PQ-20: drafts are never visible to staff
  return user.departmentId === rec.departmentId;
}

export function assertCanView(user: PublicUser, rec: ScopedRecord & { status?: string }): void {
  if (!canView(user, rec)) throw problem('FORBIDDEN');
}

export function assertOwner(user: PublicUser, rec: ScopedRecord): void {
  if (user.role !== 'APPLICANT' || user.id !== rec.applicantId) throw problem('FORBIDDEN');
}

export function assertDepartmentStaff(user: PublicUser, departmentId: number): void {
  if (user.role === 'APPLICANT' || user.departmentId !== departmentId) throw problem('FORBIDDEN');
}
