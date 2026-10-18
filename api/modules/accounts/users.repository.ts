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
