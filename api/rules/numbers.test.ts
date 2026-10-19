import { describe, expect, it } from 'vitest';
import { certificateStatus, certificateValidUntil, formatCertificate, formatReference, normalizeCertificateNo } from './numbers.js';

const TZ = 'Asia/Riyadh';

describe('formatReference (BR-02)', () => {
  it('formats KH-{YYYY}-{000001}', () => {
    expect(formatReference(2026, 123)).toBe('KH-2026-000123');
  });
});

describe('certificates (BR-09, PQ-21)', () => {
  it('formats {SERVICE}-{YYYY}-{00001} with the service code', () => {
    expect(formatCertificate('shop-lic', 2026, 1)).toBe('SHOP-LIC-2026-00001');
  });
  it('is valid through decision date + 12 months − 1 day, in local time', () => {
    expect(certificateValidUntil(new Date('2026-10-18T07:00:00Z'), TZ)).toBe('2027-10-17');
    expect(certificateValidUntil(new Date('2028-02-29T07:00:00Z'), TZ)).toBe('2029-02-28'); // anniversary Mar 1
  });
  it('is VALID on its last day and EXPIRED the day after', () => {
    expect(certificateStatus('2027-10-17', new Date('2027-10-17T20:00:00Z'), TZ)).toBe('VALID');
    expect(certificateStatus('2027-10-17', new Date('2027-10-17T21:00:00Z'), TZ)).toBe('EXPIRED'); // 00:00 local next day
  });
  it('normalises verify input', () => {
    expect(normalizeCertificateNo('  shop-lic-2026-00001 ')).toBe('SHOP-LIC-2026-00001');
  });
});
