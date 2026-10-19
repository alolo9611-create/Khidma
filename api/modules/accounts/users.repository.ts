import type { Database } from '../../core/db/connection.js';

export type Role = 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR';
export interface PublicUser { id: number; name: string; email: string; role: Role; departmentId: number | null }
export interface UserWithHash extends PublicUser { passwordHash: string }

// Neither query ever selects nationalId (D-6).
export function findUserByEmail(db: Database, normalizedEmail: string): UserWithHash | undefined {
  return db
    .prepare('SELECT id, name, email, role, departmentId, passwordHash FROM users WHERE email = ?')
    .get(normalizedEmail) as UserWithHash | undefined;
}

export function findPublicUserById(db: Database, id: number): PublicUser | undefined {
  return db
    .prepare('SELECT id, name, email, role, departmentId FROM users WHERE id = ?')
    .get(id) as PublicUser | undefined;
}

export interface ReviewerRow { id: number; name: string; departmentId: number }

export function listDepartmentReviewers(db: Database, departmentId: number): ReviewerRow[] {
  return db
    .prepare("SELECT id, name, departmentId FROM users WHERE role = 'REVIEWER' AND departmentId = ? ORDER BY name")
    .all(departmentId) as ReviewerRow[];
}

/** Only for BR-16 masking on request detail (PQ-23); never part of auth responses (D-6). */
export function findNationalId(db: Database, id: number): string | undefined {
  return (db.prepare('SELECT nationalId FROM users WHERE id = ?').get(id) as { nationalId: string } | undefined)?.nationalId;
}
