import type { Database } from '../../core/db/connection.js';

export type Role = 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR';
export interface PublicUser { id: number; name: string; email: string; role: Role; departmentId: number | null }
export interface UserWithHash extends PublicUser { passwordHash: string }

// Neither query ever selects nationalId (D-6).
export function findUserByEmail(db: Database, normalizedEmail: string): Promise<UserWithHash | undefined> {
  return db.get<UserWithHash>('SELECT id, name, email, role, departmentId, passwordHash FROM users WHERE email = ?', normalizedEmail);
}

export function findPublicUserById(db: Database, id: number): Promise<PublicUser | undefined> {
  return db.get<PublicUser>('SELECT id, name, email, role, departmentId FROM users WHERE id = ?', id);
}

export interface ReviewerRow { id: number; name: string; departmentId: number }

export function listDepartmentReviewers(db: Database, departmentId: number): Promise<ReviewerRow[]> {
  return db.all<ReviewerRow>("SELECT id, name, departmentId FROM users WHERE role = 'REVIEWER' AND departmentId = ? ORDER BY name", departmentId);
}

/** Only for BR-16 masking on request detail (PQ-23); never part of auth responses (D-6). */
export async function findNationalId(db: Database, id: number): Promise<string | undefined> {
  return (await db.get<{ nationalId: string }>('SELECT nationalId FROM users WHERE id = ?', id))?.nationalId;
}
