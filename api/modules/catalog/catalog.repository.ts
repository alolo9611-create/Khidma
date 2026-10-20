import type { InValue } from '@libsql/client';
import type { Database } from '../../core/db/connection.js';
import { FORM_FIELDS } from '../../rules/forms.js';

export interface ServiceRow {
  id: number; code: string; name: string; departmentId: number; departmentName: string;
  slaDays: number; allowMultiple: number; isActive: number;
}
export interface RequiredDocRow { serviceTypeId: number; typeCode: string; label: string; mandatory: number }

const SELECT = `SELECT s.id, s.code, s.name, s.departmentId, d.name AS departmentName, s.slaDays, s.allowMultiple, s.isActive
  FROM service_types s JOIN departments d ON d.id = s.departmentId`;

export function findServiceById(db: Database, id: number): Promise<ServiceRow | undefined> {
  return db.get<ServiceRow>(`${SELECT} WHERE s.id = ?`, id);
}
export function findServiceByCode(db: Database, code: string): Promise<ServiceRow | undefined> {
  return db.get<ServiceRow>(`${SELECT} WHERE s.code = ?`, code.toUpperCase());
}
export function listServices(db: Database, opts: { activeOnly?: boolean; departmentId?: number } = {}): Promise<ServiceRow[]> {
  const where: string[] = []; const args: InValue[] = [];
  if (opts.activeOnly) where.push('s.isActive = 1');
  if (opts.departmentId !== undefined) { where.push('s.departmentId = ?'); args.push(opts.departmentId); }
  return db.all<ServiceRow>(`${SELECT}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY s.code`, ...args);
}
export function requiredDocuments(db: Database, serviceTypeId: number): Promise<RequiredDocRow[]> {
  return db.all<RequiredDocRow>(
    'SELECT serviceTypeId, typeCode, label, mandatory FROM required_documents WHERE serviceTypeId = ? ORDER BY id', serviceTypeId,
  );
}
export async function updateServiceSettings(db: Database, id: number, patch: { slaDays?: number; isActive?: boolean }): Promise<void> {
  if (patch.slaDays !== undefined) await db.run('UPDATE service_types SET slaDays = ? WHERE id = ?', patch.slaDays, id);
  if (patch.isActive !== undefined) await db.run('UPDATE service_types SET isActive = ? WHERE id = ?', patch.isActive ? 1 : 0, id);
}

export async function toServiceView(db: Database, s: ServiceRow) {
  return {
    id: s.id, code: s.code, name: s.name, slaDays: s.slaDays, allowMultiple: s.allowMultiple === 1, isActive: s.isActive === 1,
    department: { id: s.departmentId, name: s.departmentName },
    documents: (await requiredDocuments(db, s.id)).map((d) => ({ typeCode: d.typeCode, label: d.label, mandatory: d.mandatory === 1 })),
    fields: FORM_FIELDS[s.code] ?? [],
  };
}
