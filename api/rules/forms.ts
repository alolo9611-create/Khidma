import { codePoints } from './text.js';

// PQ-06 (approved default): fixed field set per service, defined in code (dynamic forms are cut from v1).
export type FieldType = 'text' | 'integer' | 'date';
export interface FieldDef { name: string; label: string; type: FieldType; min: number; max: number }

export const FORM_FIELDS: Record<string, FieldDef[]> = {
  'SHOP-LIC': [
    { name: 'shopName', label: 'Shop name', type: 'text', min: 3, max: 100 },
    { name: 'shopAddress', label: 'Shop address', type: 'text', min: 5, max: 200 },
    { name: 'activityType', label: 'Business activity', type: 'text', min: 3, max: 100 },
  ],
  'SIGN-PMT': [
    { name: 'shopName', label: 'Shop name', type: 'text', min: 3, max: 100 },
    { name: 'signText', label: 'Sign text', type: 'text', min: 1, max: 100 },
    { name: 'signWidthCm', label: 'Sign width (cm)', type: 'integer', min: 10, max: 2000 },
    { name: 'signHeightCm', label: 'Sign height (cm)', type: 'integer', min: 10, max: 2000 },
  ],
  'EVENT-PMT': [
    { name: 'eventName', label: 'Event name', type: 'text', min: 3, max: 100 },
    { name: 'eventDate', label: 'Event date', type: 'date', min: 0, max: 0 },
    { name: 'venue', label: 'Venue', type: 'text', min: 5, max: 200 },
    { name: 'expectedAttendees', label: 'Expected attendees', type: 'integer', min: 1, max: 100000 },
  ],
};

export type FormData = Record<string, string | number>;

/** Shape check for saving a draft: known keys and primitive values only (drafts may be incomplete). */
export function sanitizeDraftForm(serviceCode: string, raw: unknown): { data: FormData; badFields: string[] } {
  const defs = FORM_FIELDS[serviceCode] ?? [];
  const data: FormData = {};
  const badFields: string[] = [];
  if (raw === undefined) return { data, badFields };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { data, badFields: ['formData'] };
  for (const [k, v] of Object.entries(raw)) {
    const def = defs.find((d) => d.name === k);
    if (!def) { badFields.push(`formData.${k}`); continue; }
    if (v === '' || v === null) continue;
    if (typeof v !== 'string' && typeof v !== 'number') { badFields.push(`formData.${k}`); continue; }
    data[k] = typeof v === 'string' ? v.slice(0, 2000) : v;
  }
  return { data, badFields };
}

/** BR-01 form part: every field valid and present (all PQ-06 fields are mandatory). Returns invalid field names. */
export function invalidFormFields(serviceCode: string, data: FormData, todayIso: string): string[] {
  const bad: string[] = [];
  for (const def of FORM_FIELDS[serviceCode] ?? []) {
    const v = data[def.name];
    if (def.type === 'text') {
      const n = typeof v === 'string' ? codePoints(v.trim()) : 0;
      if (n < def.min || n > def.max) bad.push(def.name);
    } else if (def.type === 'integer') {
      const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : NaN;
      if (!Number.isInteger(n) || n < def.min || n > def.max) bad.push(def.name);
    } else {
      const ok = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z')) && v >= todayIso;
      if (!ok) bad.push(def.name); // PQ-06: event date is today or later
    }
  }
  return bad;
}
