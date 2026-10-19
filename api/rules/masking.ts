// BR-16: national IDs show as ******1234 everywhere, except to the applicant themself and the
// request's assigned reviewer. Supervisors see the mask (PQ-23: shown on request detail only).
export function maskNationalId(raw: string): string {
  return '******' + raw.slice(-4);
}

export function nationalIdFor(raw: string, viewerId: number, ctx: { applicantId: number; assigneeId: number | null }): string {
  if (viewerId === ctx.applicantId) return raw;
  if (ctx.assigneeId !== null && viewerId === ctx.assigneeId) return raw;
  return maskNationalId(raw);
}
