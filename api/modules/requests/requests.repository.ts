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

export function findRequest(db: Database, id: number): RequestRow | undefined {
  return db.prepare(`${SELECT} WHERE r.id = ?`).get(id) as RequestRow | undefined;
}
export function listByApplicant(db: Database, applicantId: number): RequestRow[] {
  return db.prepare(`${SELECT} WHERE r.applicantId = ? ORDER BY r.id DESC`).all(applicantId) as RequestRow[];
}
export function listByDepartment(db: Database, departmentId: number, statuses: readonly string[], serviceCode?: string): RequestRow[] {
  const args: unknown[] = [departmentId, ...statuses];
  let sql = `${SELECT} WHERE s.departmentId = ? AND r.status IN (${statuses.map(() => '?').join(',')})`;
  if (serviceCode) { sql += ' AND s.code = ?'; args.push(serviceCode); }
  return db.prepare(sql).all(...args) as RequestRow[];
}
export function insertDraft(db: Database, applicantId: number, serviceTypeId: number): number {
  return Number(db.prepare("INSERT INTO requests (serviceTypeId, applicantId, status, formData) VALUES (?, ?, 'DRAFT', '{}')")
    .run(serviceTypeId, applicantId).lastInsertRowid);
}
export function updateRequest(db: Database, id: number, patch: Partial<Omit<RequestRow, 'id'>>): void {
  const cols = ['referenceNo', 'status', 'formData', 'assigneeId', 'infoCycles', 'submittedAt', 'dueAt', 'decidedAt', 'rejectReason', 'certificateNo'] as const;
  const set = cols.filter((c) => c in patch);
  if (!set.length) return;
  db.prepare(`UPDATE requests SET ${set.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
    .run(...set.map((c) => (patch as Record<string, unknown>)[c] ?? null), id);
}
export function declaredDocuments(db: Database, requestId: number): Record<string, string> {
  const rows = db.prepare('SELECT typeCode, documentNumber FROM declared_documents WHERE requestId = ?').all(requestId) as { typeCode: string; documentNumber: string }[];
  return Object.fromEntries(rows.map((r) => [r.typeCode, r.documentNumber]));
}
export function setDeclaredDocument(db: Database, requestId: number, typeCode: string, documentNumber: string | null): void {
  if (documentNumber === null) db.prepare('DELETE FROM declared_documents WHERE requestId = ? AND typeCode = ?').run(requestId, typeCode);
  else db.prepare(`INSERT INTO declared_documents (requestId, typeCode, documentNumber) VALUES (?, ?, ?)
    ON CONFLICT (requestId, typeCode) DO UPDATE SET documentNumber = excluded.documentNumber`).run(requestId, typeCode, documentNumber);
}
export function countOpenForApplicantService(db: Database, applicantId: number, serviceTypeId: number, exceptId: number, statuses: readonly string[]): { n: number; ref: string | null } {
  const row = db.prepare(`SELECT COUNT(*) AS n, MIN(referenceNo) AS ref FROM requests WHERE applicantId = ? AND serviceTypeId = ? AND id <> ?
    AND status IN (${statuses.map(() => '?').join(',')})`).get(applicantId, serviceTypeId, exceptId, ...statuses) as { n: number; ref: string | null };
  return row;
}
export function countActiveForReviewer(db: Database, reviewerId: number, statuses: readonly string[]): number {
  return (db.prepare(`SELECT COUNT(*) AS n FROM requests WHERE assigneeId = ? AND status IN (${statuses.map(() => '?').join(',')})`)
    .get(reviewerId, ...statuses) as { n: number }).n;
}
export function nextSequence(db: Database, table: 'reference_sequences' | 'certificate_sequences', key: Record<string, number>): number {
  const cols = Object.keys(key);
  const where = cols.map((c) => `${c} = ?`).join(' AND ');
  db.prepare(`INSERT OR IGNORE INTO ${table} (${cols.join(', ')}, lastSeq) VALUES (${cols.map(() => '?').join(', ')}, 0)`).run(...Object.values(key));
  db.prepare(`UPDATE ${table} SET lastSeq = lastSeq + 1 WHERE ${where}`).run(...Object.values(key));
  return (db.prepare(`SELECT lastSeq FROM ${table} WHERE ${where}`).get(...Object.values(key)) as { lastSeq: number }).lastSeq;
}

export interface ActivityRow { id: number; action: string; fromStatus: string | null; toStatus: string | null; note: string | null; at: string; actorId: number; actorName: string; actorRole: 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR' }
export function activityFor(db: Database, requestId: number): ActivityRow[] {
  return db.prepare(`SELECT l.id, l.action, l.fromStatus, l.toStatus, l.note, l.at, l.actorId, u.name AS actorName, u.role AS actorRole
    FROM activity_log l JOIN users u ON u.id = l.actorId WHERE l.requestId = ? ORDER BY l.at ASC, l.id ASC`).all(requestId) as ActivityRow[];
}

export interface CommentRow { id: number; visibility: 'PUBLIC' | 'INTERNAL'; body: string; createdAt: string; authorId: number; authorName: string; authorRole: 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR' }
export function commentsFor(db: Database, requestId: number): CommentRow[] {
  return db.prepare(`SELECT c.id, c.visibility, c.body, c.createdAt, c.authorId, u.name AS authorName, u.role AS authorRole
    FROM comments c JOIN users u ON u.id = c.authorId WHERE c.requestId = ? ORDER BY c.createdAt ASC, c.id ASC`).all(requestId) as CommentRow[];
}
export function insertComment(db: Database, c: { requestId: number; authorId: number; visibility: string; body: string; createdAt: string }): number {
  return Number(db.prepare('INSERT INTO comments (requestId, authorId, visibility, body, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(c.requestId, c.authorId, c.visibility, c.body, c.createdAt).lastInsertRowid);
}
