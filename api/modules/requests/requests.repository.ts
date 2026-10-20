import type { InValue } from '@libsql/client';
import type { Database } from '../../core/db/connection.js';
import type { RequestStatus } from '../../rules/statuses.js';

export interface RequestRow {
  id: number; referenceNo: string | null; serviceTypeId: number; applicantId: number; status: RequestStatus;
  formData: string; assigneeId: number | null; infoCycles: number; submittedAt: string | null; dueAt: string | null;
  decidedAt: string | null; rejectReason: string | null; certificateNo: string | null;
  serviceCode: string; serviceName: string; departmentId: number; slaDays: number; allowMultiple: number; serviceActive: number;
  applicantName: string; assigneeName: string | null;
}

const SELECT = `SELECT r.*, s.code AS serviceCode, s.name AS serviceName, s.departmentId, s.slaDays, s.allowMultiple,
    s.isActive AS serviceActive, a.name AS applicantName, u.name AS assigneeName
  FROM requests r
  JOIN service_types s ON s.id = r.serviceTypeId
  JOIN users a ON a.id = r.applicantId
  LEFT JOIN users u ON u.id = r.assigneeId`;

export function findRequest(db: Database, id: number): Promise<RequestRow | undefined> {
  return db.get<RequestRow>(`${SELECT} WHERE r.id = ?`, id);
}
export function listByApplicant(db: Database, applicantId: number): Promise<RequestRow[]> {
  return db.all<RequestRow>(`${SELECT} WHERE r.applicantId = ? ORDER BY r.id DESC`, applicantId);
}
export function listByDepartment(db: Database, departmentId: number, statuses: readonly string[], serviceCode?: string): Promise<RequestRow[]> {
  const args: InValue[] = [departmentId, ...statuses];
  let sql = `${SELECT} WHERE s.departmentId = ? AND r.status IN (${statuses.map(() => '?').join(',')})`;
  if (serviceCode) { sql += ' AND s.code = ?'; args.push(serviceCode); }
  return db.all<RequestRow>(sql, ...args);
}
export async function insertDraft(db: Database, applicantId: number, serviceTypeId: number): Promise<number> {
  return (await db.run("INSERT INTO requests (serviceTypeId, applicantId, status, formData) VALUES (?, ?, 'DRAFT', '{}')",
    serviceTypeId, applicantId)).lastInsertRowid;
}
export async function updateRequest(db: Database, id: number, patch: Partial<Omit<RequestRow, 'id'>>): Promise<void> {
  const cols = ['referenceNo', 'status', 'formData', 'assigneeId', 'infoCycles', 'submittedAt', 'dueAt', 'decidedAt', 'rejectReason', 'certificateNo'] as const;
  const set = cols.filter((c) => c in patch);
  if (!set.length) return;
  await db.run(`UPDATE requests SET ${set.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    ...set.map((c) => ((patch as Record<string, InValue | undefined>)[c] ?? null)), id);
}
export async function declaredDocuments(db: Database, requestId: number): Promise<Record<string, string>> {
  const rows = await db.all<{ typeCode: string; documentNumber: string }>(
    'SELECT typeCode, documentNumber FROM declared_documents WHERE requestId = ?', requestId,
  );
  return Object.fromEntries(rows.map((r) => [r.typeCode, r.documentNumber]));
}
export async function setDeclaredDocument(db: Database, requestId: number, typeCode: string, documentNumber: string | null): Promise<void> {
  if (documentNumber === null) await db.run('DELETE FROM declared_documents WHERE requestId = ? AND typeCode = ?', requestId, typeCode);
  else await db.run(`INSERT INTO declared_documents (requestId, typeCode, documentNumber) VALUES (?, ?, ?)
    ON CONFLICT (requestId, typeCode) DO UPDATE SET documentNumber = excluded.documentNumber`, requestId, typeCode, documentNumber);
}
export async function countOpenForApplicantService(db: Database, applicantId: number, serviceTypeId: number, exceptId: number, statuses: readonly string[]): Promise<{ n: number; ref: string | null }> {
  return (await db.get<{ n: number; ref: string | null }>(`SELECT COUNT(*) AS n, MIN(referenceNo) AS ref FROM requests WHERE applicantId = ? AND serviceTypeId = ? AND id <> ?
    AND status IN (${statuses.map(() => '?').join(',')})`, applicantId, serviceTypeId, exceptId, ...statuses))!;
}
export async function countActiveForReviewer(db: Database, reviewerId: number, statuses: readonly string[]): Promise<number> {
  return (await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM requests WHERE assigneeId = ? AND status IN (${statuses.map(() => '?').join(',')})`,
    reviewerId, ...statuses))!.n;
}
export async function nextSequence(db: Database, table: 'reference_sequences' | 'certificate_sequences', key: Record<string, number>): Promise<number> {
  const cols = Object.keys(key);
  const where = cols.map((c) => `${c} = ?`).join(' AND ');
  await db.run(`INSERT OR IGNORE INTO ${table} (${cols.join(', ')}, lastSeq) VALUES (${cols.map(() => '?').join(', ')}, 0)`, ...Object.values(key));
  await db.run(`UPDATE ${table} SET lastSeq = lastSeq + 1 WHERE ${where}`, ...Object.values(key));
  return (await db.get<{ lastSeq: number }>(`SELECT lastSeq FROM ${table} WHERE ${where}`, ...Object.values(key)))!.lastSeq;
}

export interface ActivityRow { id: number; action: string; fromStatus: string | null; toStatus: string | null; note: string | null; at: string; actorId: number; actorName: string; actorRole: 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR' }
export function activityFor(db: Database, requestId: number): Promise<ActivityRow[]> {
  return db.all<ActivityRow>(`SELECT l.id, l.action, l.fromStatus, l.toStatus, l.note, l.at, l.actorId, u.name AS actorName, u.role AS actorRole
    FROM activity_log l JOIN users u ON u.id = l.actorId WHERE l.requestId = ? ORDER BY l.at ASC, l.id ASC`, requestId);
}

export interface CommentRow { id: number; visibility: 'PUBLIC' | 'INTERNAL'; body: string; createdAt: string; authorId: number; authorName: string; authorRole: 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR' }
export function commentsFor(db: Database, requestId: number): Promise<CommentRow[]> {
  return db.all<CommentRow>(`SELECT c.id, c.visibility, c.body, c.createdAt, c.authorId, u.name AS authorName, u.role AS authorRole
    FROM comments c JOIN users u ON u.id = c.authorId WHERE c.requestId = ? ORDER BY c.createdAt ASC, c.id ASC`, requestId);
}
export async function insertComment(db: Database, c: { requestId: number; authorId: number; visibility: string; body: string; createdAt: string }): Promise<number> {
  return (await db.run('INSERT INTO comments (requestId, authorId, visibility, body, createdAt) VALUES (?, ?, ?, ?, ?)',
    c.requestId, c.authorId, c.visibility, c.body, c.createdAt)).lastInsertRowid;
}
