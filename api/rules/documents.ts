// F-06 / BR-01 documents part + PQ-16: document numbers are 1–40 chars of A–Z a–z 0–9 - / (no checksum).
export const DOCUMENT_NUMBER_RE = /^[A-Za-z0-9\-/]{1,40}$/;

export interface RequiredDoc { typeCode: string; label: string; mandatory: boolean }

export function isValidDocumentNumber(raw: string): boolean {
  return DOCUMENT_NUMBER_RE.test(raw);
}

/** Returns typeCodes of mandatory documents that are missing or invalid, plus any invalid optional ones. */
export function invalidDocuments(required: RequiredDoc[], declared: Record<string, string>): string[] {
  const bad: string[] = [];
  for (const doc of required) {
    const v = declared[doc.typeCode]?.trim() ?? '';
    if (v === '') { if (doc.mandatory) bad.push(doc.typeCode); continue; }
    if (!isValidDocumentNumber(v)) bad.push(doc.typeCode);
  }
  return bad;
}
