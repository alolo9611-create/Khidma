// PQ-16: trim before validating; lengths are Unicode code points; free text max 1000.
export const TEXT_MAX = 1000;

export function codePoints(s: string): number {
  return [...s].length;
}

/** Returns the trimmed text when its length is within [min, max], else null. */
export function boundedText(raw: unknown, min: number, max = TEXT_MAX): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  const n = codePoints(t);
  return n >= min && n <= max ? t : null;
}

// BR-07: an info request message needs at least 20 characters.
export const INFO_MESSAGE_MIN = 20;
// BR-08: a rejection justification needs at least 30 characters.
export const REJECT_JUSTIFICATION_MIN = 30;
export const REJECT_REASONS = ['DOC_INVALID', 'NOT_ELIGIBLE', 'DUPLICATE', 'OTHER'] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];
// BR-07: max 2 info requests per request.
export const MAX_INFO_CYCLES = 2;
