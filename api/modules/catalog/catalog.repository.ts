import type { Database } from '../../core/db/connection.js';
import { FORM_FIELDS } from '../../rules/forms.js';

export interface ServiceRow {
  id: number; code: string; name: string; departmentId: number; departmentName: string;
  slaDays: number; allowMultiple: number; isActive: number;
}
export interface RequiredDocRow { serviceTypeId: number; typeCode: string; label: string; mandatory: number }

const SELECT = `SELECT s.id, s.code, s.name, s.departmentId, d.name AS departmentName, s.slaDays, s.allowMultiple, s.isActive
  FROM service_types s JOIN departments d ON d.id = s.departmentId`;

export function findServiceById(db: Database, id: number): ServiceRow | undefined {
  return db.prepare(`${SELECT} WHERE s.id = ?`).get(id) as ServiceRow | undefined;
}
export function findServiceByCode(db: Database, code: string): ServiceRow | undefined {
  return db.prepare(`${SELECT} WHERE s.code = ?`).get(code.toUpperCase()) as ServiceRow | undefined;
}
export function listServices(db: Database, opts: { activeOnly?: boolean; departmentId?: number } = {}): ServiceRow[] {
  const where: string[] = []; const args: unknown[] = [];
  if (opts.activeOnly) where.push('s.isActive = 1');
  if (opts.departmentId !== undefined) { where.push('s.departmentId = ?'); args.push(opts.departmentId); }
  return db.prepare(`${SELECT}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY s.code`).all(...args) as ServiceRow[];
}
export function requiredDocuments(db: Database, serviceTypeId: number): RequiredDocRow[] {
  return db.prepare('SELECT serviceTypeId, typeCode, label, mandatory FROM required_documents WHERE serviceTypeId = ? ORDER BY id')
    .all(serviceTypeId) as RequiredDocRow[];
}
export function updateServiceSettings(db: Database, id: number, patch: { slaDays?: number; isActive?: boolean }): void {
  if (patch.slaDays !== undefined) db.prepare('UPDATE service_types SET slaDays = ? WHERE id = ?').run(patch.slaDays, id);
  if (patch.isActive !== undefined) db.prepare('UPDATE service_types SET isActive = ? WHERE id = ?').run(patch.isActive ? 1 : 0, id);
}

export function toServiceView(db: Database, s: ServiceRow) {
  return {
    id: s.id, code: s.code, name: s.name, slaDays: s.slaDays, allowMultiple: s.allowMultiple === 1, isActive: s.isActive === 1,
    department: { id: s.departmentId, name: s.departmentName },
    documents: requiredDocuments(db, s.id).map((d) => ({ typeCode: d.typeCode, label: d.label, mandatory: d.mandatory === 1 })),
    fields: FORM_FIELDS[s.code] ?? [],
  };
}
