import { addDays, localDate, isoDate } from '../core/time.js';

// BR-02: KH-{YYYY}-{000001}; the sequence restarts each year and a number is never reused.
export function formatReference(year: number, seq: number): string {
  if (seq < 1 || seq > 999_999) throw new Error(`reference sequence out of range: ${seq}`);
  return `KH-${year}-${String(seq).padStart(6, '0')}`;
}

// BR-09 + PQ-21: {SERVICE}-{YYYY}-{00001}; SERVICE = service code; sequence per service per year.
export function formatCertificate(serviceCode: string, year: number, seq: number): string {
  if (seq < 1 || seq > 99_999) throw new Error(`certificate sequence out of range: ${seq}`);
  return `${serviceCode.toUpperCase()}-${year}-${String(seq).padStart(5, '0')}`;
}

// PQ-21: valid through decision local date + 12 months − 1 day (inclusive). Feb 29 → anniversary Mar 1.
export function certificateValidUntil(decidedAt: Date, tz: string): string {
  const d = localDate(decidedAt, tz);
  const anniversary = new Date(Date.UTC(d.year + 1, d.month - 1, d.day, 12)); // JS rolls Feb 29 → Mar 1
  const a = { year: anniversary.getUTCFullYear(), month: anniversary.getUTCMonth() + 1, day: anniversary.getUTCDate() };
  return isoDate(addDays(a, -1));
}

export function certificateStatus(validUntil: string, now: Date, tz: string): 'VALID' | 'EXPIRED' {
  return isoDate(localDate(now, tz)) > validUntil ? 'EXPIRED' : 'VALID';
}

/** PQ-21: verify input is trimmed and upper-cased. */
export function normalizeCertificateNo(raw: string): string {
  return raw.trim().toUpperCase();
}
