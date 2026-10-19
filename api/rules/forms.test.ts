import { describe, expect, it } from 'vitest';
import { invalidDocuments, isValidDocumentNumber } from './documents.js';
import { invalidFormFields, sanitizeDraftForm } from './forms.js';

// BR-01: every mandatory form field valid and every mandatory document declared.
describe('form fields (BR-01, PQ-06)', () => {
  it('reports missing and out-of-range fields', () => {
    expect(invalidFormFields('SHOP-LIC', { shopName: 'Ok shop', shopAddress: 'x' }, '2026-10-18')).toEqual(['shopAddress', 'activityType']);
    expect(invalidFormFields('SIGN-PMT', { shopName: 'Ok shop', signText: 'Hi', signWidthCm: 5, signHeightCm: '100' }, '2026-10-18')).toEqual(['signWidthCm']);
  });
  it('requires an event date of today or later', () => {
    const base = { eventName: 'Fair', venue: 'Main hall', expectedAttendees: 50 };
    expect(invalidFormFields('EVENT-PMT', { ...base, eventDate: '2026-10-17' }, '2026-10-18')).toEqual(['eventDate']);
    expect(invalidFormFields('EVENT-PMT', { ...base, eventDate: '2026-10-18' }, '2026-10-18')).toEqual([]);
  });
  it('drafts accept partial data but reject unknown keys', () => {
    expect(sanitizeDraftForm('SHOP-LIC', { shopName: 'A' }).badFields).toEqual([]);
    expect(sanitizeDraftForm('SHOP-LIC', { status: 'APPROVED' }).badFields).toEqual(['formData.status']);
  });
});

describe('declared documents (BR-01, PQ-16)', () => {
  const required = [
    { typeCode: 'LEASE_CONTRACT', label: 'Lease', mandatory: true },
    { typeCode: 'OPTIONAL', label: 'Optional', mandatory: false },
  ];
  it('blocks a missing mandatory document; an optional one may be empty', () => {
    expect(invalidDocuments(required, {})).toEqual(['LEASE_CONTRACT']);
    expect(invalidDocuments(required, { LEASE_CONTRACT: 'LC-1' })).toEqual([]);
  });
  it('validates the number format', () => {
    expect(isValidDocumentNumber('CR-1010/22')).toBe(true);
    expect(isValidDocumentNumber('bad number!')).toBe(false);
    expect(isValidDocumentNumber('x'.repeat(41))).toBe(false);
  });
});
