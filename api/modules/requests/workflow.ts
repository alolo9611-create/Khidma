import { appendActivity } from '../../activity/writer.js';
import type { Clock } from '../../core/clock.js';
import type { Database } from '../../core/db/connection.js';
import { invalid, problem } from '../../core/problem.js';
import { isoDate, localDate } from '../../core/time.js';
import { assertCanView, assertDepartmentStaff, assertOwner } from '../../rules/access.js';
import { invalidDocuments, isValidDocumentNumber } from '../../rules/documents.js';
import { computeDueAt } from '../../rules/due-date.js';
import { invalidFormFields, sanitizeDraftForm, type FormData } from '../../rules/forms.js';
import { applicantLink, notificationMessage, staffLink, type NotifyEvent } from '../../rules/notifications.js';
import { formatCertificate, formatReference } from '../../rules/numbers.js';
import { ACTIVE_STATUSES, OPEN_STATUSES, type RequestStatus } from '../../rules/statuses.js';
import {
  boundedText, INFO_MESSAGE_MIN, MAX_INFO_CYCLES, REJECT_JUSTIFICATION_MIN, REJECT_REASONS, TEXT_MAX,
} from '../../rules/text.js';
import { assertTransition, type TransitionId } from '../../rules/transitions.js';
import { canPostComment } from '../../rules/visibility.js';
import type { PublicUser } from '../accounts/users.repository.js';
import { findServiceByCode, requiredDocuments } from '../catalog/catalog.repository.js';
import { notify } from '../trust/notify.js';
import {
  countActiveForReviewer, countOpenForApplicantService, declaredDocuments, findRequest, insertComment, insertDraft,
  nextSequence, setDeclaredDocument, updateRequest, type RequestRow,
} from './requests.repository.js';

export interface WorkflowDeps { db: Database; clock: Clock; timezone: string }

function load(deps: WorkflowDeps, id: number): RequestRow {
  const r = Number.isInteger(id) ? findRequest(deps.db, id) : undefined;
  if (!r) throw problem('NOT_FOUND');
  return r;
}
const scope = (r: RequestRow) => ({ applicantId: r.applicantId, departmentId: r.departmentId, status: r.status });
const ref = (r: RequestRow) => r.referenceNo ?? `draft #${r.id}`;

/** One state change: status update, BR-15 activity entry and BR-14 applicant notification, in the caller's transaction. */
function transition(
  deps: WorkflowDeps, r: RequestRow, actor: PublicUser, id: TransitionId, action: string,
  patch: Partial<RequestRow>, note: string | null, event: NotifyEvent,
): RequestStatus {
  const to = assertTransition(id, r.status);
  const at = deps.clock.now().toISOString();
  updateRequest(deps.db, r.id, { ...patch, status: to });
  appendActivity(deps.db, { requestId: r.id, actorId: actor.id, action, fromStatus: r.status, toStatus: to, note, at });
  const reference = (patch.referenceNo as string | undefined) ?? ref(r);
  notify(deps.db, {
    userId: r.applicantId, requestId: r.id, link: applicantLink(r.id), at,
    message: notificationMessage(event, reference, (patch.certificateNo as string | undefined) ?? r.certificateNo),
  });
  return to;
}

function tx<T>(deps: WorkflowDeps, fn: () => T): T {
  return deps.db.transaction(fn)();
}

// ---------- Applicant: F-05, F-06, F-07, F-08, F-10, F-13 (respond) ----------

export function createDraft(deps: WorkflowDeps, user: PublicUser, serviceCode: unknown): number {
  if (user.role !== 'APPLICANT') throw problem('FORBIDDEN');
  if (typeof serviceCode !== 'string' || !serviceCode.trim()) throw invalid(['serviceCode']);
  const s = findServiceByCode(deps.db, serviceCode.trim());
  if (!s) throw problem('NOT_FOUND');
  if (s.isActive !== 1) throw problem('SERVICE_INACTIVE'); // PQ-07
  return insertDraft(deps.db, user.id, s.id);
}

/** Save form data and/or declared documents. Allowed while DRAFT, and while INFO_REQUESTED (BR-04). */
export function saveDraft(deps: WorkflowDeps, user: PublicUser, id: number, body: Record<string, unknown>): void {
  const r = load(deps, id);
  assertOwner(user, scope(r));
  if (r.status !== 'DRAFT' && r.status !== 'INFO_REQUESTED') throw problem('INVALID_TRANSITION'); // BR-04 read-only
  const bad: string[] = [];
  for (const k of Object.keys(body)) if (k !== 'formData' && k !== 'documents') bad.push(k); // no free PATCH of status etc.
  const { data, badFields } = sanitizeDraftForm(r.serviceCode, body.formData);
  bad.push(...badFields);
  const docs: [string, string | null][] = [];
  if (body.documents !== undefined) {
    const known = new Set(requiredDocuments(deps.db, r.serviceTypeId).map((d) => d.typeCode));
    if (!body.documents || typeof body.documents !== 'object' || Array.isArray(body.documents)) bad.push('documents');
    else for (const [code, value] of Object.entries(body.documents as Record<string, unknown>)) {
      if (!known.has(code)) { bad.push(`documents.${code}`); continue; }
      if (value === null || value === '') { docs.push([code, null]); continue; }
      if (typeof value !== 'string' || !isValidDocumentNumber(value.trim())) { bad.push(`documents.${code}`); continue; }
      docs.push([code, value.trim()]);
    }
  }
  if (bad.length) throw invalid(bad);
  tx(deps, () => {
    if (body.formData !== undefined) {
      const merged: FormData = { ...(JSON.parse(r.formData) as FormData), ...data };
      for (const [k, v] of Object.entries(body.formData as Record<string, unknown>)) if (v === '' || v === null) delete merged[k];
      updateRequest(deps.db, r.id, { formData: JSON.stringify(merged) });
    }
    for (const [code, value] of docs) setDeclaredDocument(deps.db, r.id, code, value);
  });
}

/** BR-01: every form field valid and every mandatory document declared. */
function assertComplete(deps: WorkflowDeps, r: RequestRow): void {
  const today = isoDate(localDate(deps.clock.now(), deps.timezone));
  const fields = invalidFormFields(r.serviceCode, JSON.parse(r.formData) as FormData, today).map((f) => `formData.${f}`);
  const docs = invalidDocuments(
    requiredDocuments(deps.db, r.serviceTypeId).map((d) => ({ typeCode: d.typeCode, label: d.label, mandatory: d.mandatory === 1 })),
    declaredDocuments(deps.db, r.id),
  ).map((d) => `documents.${d}`);
  if (fields.length || docs.length) throw problem('REQ_INCOMPLETE', { fields: [...fields, ...docs] });
}

// T-01 (BR-01, BR-02, BR-03, BR-11).
export function submit(deps: WorkflowDeps, user: PublicUser, id: number): void {
  tx(deps, () => {
    const r = load(deps, id);
    assertOwner(user, scope(r));
    assertTransition('T-01', r.status);
    if (r.serviceActive !== 1) throw problem('SERVICE_INACTIVE'); // PQ-07
    assertComplete(deps, r);
    if (r.allowMultiple !== 1) { // BR-03; DRAFT is not "open" (⛔ PQ-10 provisional)
      const dup = countOpenForApplicantService(deps.db, r.applicantId, r.serviceTypeId, r.id, OPEN_STATUSES);
      if (dup.n > 0) throw problem('REQ_DUPLICATE_OPEN', { openReferenceNo: dup.ref });
    }
    const now = deps.clock.now();
    const year = localDate(now, deps.timezone).year;
    const referenceNo = formatReference(year, nextSequence(deps.db, 'reference_sequences', { year })); // BR-02
    const dueAt = computeDueAt(now, r.slaDays, deps.timezone).toISOString(); // BR-11
    transition(deps, r, user, 'T-01', 'SUBMIT', { referenceNo, submittedAt: now.toISOString(), dueAt }, null, 'SUBMITTED');
  });
}

// T-07 (BR-10, PQ-17): explicit confirmation is required by the API too.
export function withdraw(deps: WorkflowDeps, user: PublicUser, id: number, body: Record<string, unknown>): void {
  if (body.confirm !== true) throw invalid(['confirm']);
  tx(deps, () => {
    const r = load(deps, id);
    assertOwner(user, scope(r));
    transition(deps, r, user, 'T-07', 'WITHDRAW', {}, null, 'WITHDRAWN'); // frees the load slot: load counts active statuses only
  });
}

// T-04 (BR-04, PQ-15): optional message; BR-01 is checked again; back to the same assignee.
export function respond(deps: WorkflowDeps, user: PublicUser, id: number, body: Record<string, unknown>): void {
  let note: string | null = null;
  if (body.message !== undefined && body.message !== null && body.message !== '') {
    note = boundedText(body.message, 1);
    if (note === null) throw invalid(['message']);
  }
  tx(deps, () => {
    const r = load(deps, id);
    assertOwner(user, scope(r));
    assertTransition('T-04', r.status);
    assertComplete(deps, r);
    transition(deps, r, user, 'T-04', 'RESPOND', {}, note, 'RESPONDED');
  });
}

// ---------- Staff: F-12, F-13 (request info), F-14 ----------

function loadForStaff(deps: WorkflowDeps, user: PublicUser, id: number): RequestRow {
  const r = load(deps, id);
  assertDepartmentStaff(user, r.departmentId); // BR-18
  if (r.status === 'DRAFT') throw problem('FORBIDDEN'); // PQ-20: drafts are private to the applicant
  return r;
}

/** T-03/T-05/T-06 actor: the assigned reviewer, or the department supervisor (PQ-14 a; handoff product-owner decision). */
function assertCanDecide(user: PublicUser, r: RequestRow): void {
  if (user.role === 'SUPERVISOR') return;
  if (user.role === 'REVIEWER' && r.assigneeId === user.id) return;
  throw problem('FORBIDDEN');
}

// T-02 pick (BR-05, BR-06): reviewers only; supervisors assign instead (PQ-14 b).
export function pick(deps: WorkflowDeps, user: PublicUser, id: number): void {
  tx(deps, () => {
    const r = loadForStaff(deps, user, id);
    if (user.role !== 'REVIEWER') throw problem('FORBIDDEN');
    assertTransition('T-02', r.status);
    const limit = (deps.db.prepare('SELECT maxActivePerReviewer AS n FROM departments WHERE id = ?').get(r.departmentId) as { n: number }).n;
    if (countActiveForReviewer(deps.db, user.id, ACTIVE_STATUSES) >= limit) throw problem('LOAD_LIMIT', { limit });
    transition(deps, r, user, 'T-02', 'PICK', { assigneeId: user.id }, null, 'IN_REVIEW'); // self-pick: no reviewer notification (PQ-22 b)
  });
}

// T-02 assign / reassign (BR-05; supervisors can still assign above the limit, BR-06).
export function assign(deps: WorkflowDeps, user: PublicUser, id: number, body: Record<string, unknown>): void {
  const reviewerId = Number(body.reviewerId);
  if (!Number.isInteger(reviewerId)) throw invalid(['reviewerId']);
  tx(deps, () => {
    const r = loadForStaff(deps, user, id);
    if (user.role !== 'SUPERVISOR') throw problem('FORBIDDEN');
    const target = deps.db.prepare('SELECT id, role, departmentId FROM users WHERE id = ?').get(reviewerId) as { id: number; role: string; departmentId: number | null } | undefined;
    if (!target || target.role !== 'REVIEWER' || target.departmentId !== r.departmentId) throw invalid(['reviewerId']); // PQ-14 b
    const at = deps.clock.now().toISOString();
    if (r.status === 'SUBMITTED') {
      transition(deps, r, user, 'T-02', 'ASSIGN', { assigneeId: reviewerId }, null, 'IN_REVIEW');
    } else if (r.status === 'IN_REVIEW' || r.status === 'INFO_REQUESTED') { // reassign, status unchanged (PQ-14 c)
      if (r.assigneeId === reviewerId) throw invalid(['reviewerId']);
      updateRequest(deps.db, r.id, { assigneeId: reviewerId });
      appendActivity(deps.db, { requestId: r.id, actorId: user.id, action: 'REASSIGN', fromStatus: r.status, toStatus: r.status, note: null, at });
    } else {
      throw problem('INVALID_TRANSITION');
    }
    // BR-14: an assignment notifies the new reviewer; the previous reviewer is not notified (PQ-14 d).
    notify(deps.db, { userId: reviewerId, requestId: r.id, link: staffLink(r.id), at, message: notificationMessage('ASSIGNED', ref(r)) });
  });
}

// T-03 (BR-07).
export function requestInfo(deps: WorkflowDeps, user: PublicUser, id: number, body: Record<string, unknown>): void {
  const message = boundedText(body.message, INFO_MESSAGE_MIN, TEXT_MAX);
  if (message === null) throw invalid(['message']);
  tx(deps, () => {
    const r = loadForStaff(deps, user, id);
    assertCanDecide(user, r);
    assertTransition('T-03', r.status);
    if (r.infoCycles >= MAX_INFO_CYCLES) throw problem('INFO_LIMIT');
    transition(deps, r, user, 'T-03', 'REQUEST_INFO', { infoCycles: r.infoCycles + 1 }, message, 'INFO_REQUESTED');
  });
}

// T-05 (BR-09).
export function approve(deps: WorkflowDeps, user: PublicUser, id: number): void {
  tx(deps, () => {
    const r = loadForStaff(deps, user, id);
    assertCanDecide(user, r);
    assertTransition('T-05', r.status);
    const now = deps.clock.now();
    const year = localDate(now, deps.timezone).year;
    const certificateNo = formatCertificate(r.serviceCode, year, nextSequence(deps.db, 'certificate_sequences', { serviceTypeId: r.serviceTypeId, year }));
    transition(deps, r, user, 'T-05', 'APPROVE', { certificateNo, decidedAt: now.toISOString() }, null, 'APPROVED');
  });
}

// T-06 (BR-08): reason code + justification ≥ 30 characters, shown to the applicant.
export function reject(deps: WorkflowDeps, user: PublicUser, id: number, body: Record<string, unknown>): void {
  const bad: string[] = [];
  if (!(REJECT_REASONS as readonly unknown[]).includes(body.reasonCode)) bad.push('reasonCode');
  const justification = boundedText(body.justification, REJECT_JUSTIFICATION_MIN, TEXT_MAX);
  if (justification === null) bad.push('justification');
  if (bad.length) throw invalid(bad);
  tx(deps, () => {
    const r = loadForStaff(deps, user, id);
    assertCanDecide(user, r);
    assertTransition('T-06', r.status);
    transition(deps, r, user, 'T-06', 'REJECT', { rejectReason: body.reasonCode as string, decidedAt: deps.clock.now().toISOString() }, justification, 'REJECTED');
  });
}

// ---------- F-15 comments (BR-18; PQ-19 provisional) ----------

export function addComment(deps: WorkflowDeps, user: PublicUser, id: number, body: Record<string, unknown>): number {
  const visibility = body.visibility === 'INTERNAL' ? 'INTERNAL' : body.visibility === 'PUBLIC' ? 'PUBLIC' : null;
  const text = boundedText(body.body, 1, TEXT_MAX);
  const bad: string[] = [];
  if (!visibility) bad.push('visibility');
  if (text === null) bad.push('body');
  if (bad.length) throw invalid(bad);
  const r = load(deps, id);
  assertCanView(user, scope(r));
  if (!canPostComment(user.role, visibility!, r.status)) {
    if (r.status === 'DRAFT') throw problem('INVALID_TRANSITION');
    throw problem('FORBIDDEN');
  }
  return insertComment(deps.db, { requestId: r.id, authorId: user.id, visibility: visibility!, body: text!, createdAt: deps.clock.now().toISOString() });
}

