import { isoDate, localDate } from '../../core/time.js';
import { invalid, problem } from '../../core/problem.js';
import { assertCanView } from '../../rules/access.js';
import { nationalIdFor } from '../../rules/masking.js';
import { certificateStatus, certificateValidUntil } from '../../rules/numbers.js';
import { compareForQueue, slaStatus, workingMsUntil, type SlaStatus } from '../../rules/sla.js';
import { computeDueAt } from '../../rules/due-date.js';
import { ACTIVE_STATUSES, OPEN_STATUSES, isRequestStatus, type RequestStatus } from '../../rules/statuses.js';
import { MAX_INFO_CYCLES } from '../../rules/text.js';
import { canTransition } from '../../rules/transitions.js';
import { timelineForApplicant } from '../../rules/visibility.js';
import { FORM_FIELDS } from '../../rules/forms.js';
import { findNationalId, listDepartmentReviewers, type PublicUser } from '../accounts/users.repository.js';
import { requiredDocuments } from '../catalog/catalog.repository.js';
import {
  activityFor, commentsFor, countActiveForReviewer, declaredDocuments, findRequest, listByApplicant, listByDepartment,
  type RequestRow,
} from './requests.repository.js';
import type { WorkflowDeps } from './workflow.js';

const sla = (deps: WorkflowDeps, r: RequestRow): SlaStatus | null =>
  slaStatus(r.status, r.dueAt ? new Date(r.dueAt) : null, deps.clock.now(), deps.timezone);

/** Whole working days left until dueAt (display only; BR-12 status comes from `sla`). */
const workingDaysLeft = (deps: WorkflowDeps, r: RequestRow): number | null => {
  if (!r.dueAt || !OPEN_STATUSES.includes(r.status)) return null;
  const ms = workingMsUntil(deps.clock.now(), new Date(r.dueAt), deps.timezone);
  return ms <= 0 ? 0 : Math.max(1, Math.floor(ms / 86_400_000));
};

function certificate(deps: WorkflowDeps, r: RequestRow) {
  if (!r.certificateNo || !r.decidedAt) return null;
  const validUntil = certificateValidUntil(new Date(r.decidedAt), deps.timezone);
  return { certificateNo: r.certificateNo, issuedOn: isoDate(localDate(new Date(r.decidedAt), deps.timezone)), validUntil, status: certificateStatus(validUntil, deps.clock.now(), deps.timezone) };
}

/** Role × state action table (HANDOFF §5, reconciled with PQ-14 and BR-04/10). */
export function allowedActions(user: PublicUser, r: RequestRow) {
  const owner = user.role === 'APPLICANT' && user.id === r.applicantId;
  const staff = user.role !== 'APPLICANT' && user.departmentId === r.departmentId;
  const decider = (user.role === 'SUPERVISOR' && staff) || (user.role === 'REVIEWER' && staff && r.assigneeId === user.id);
  return {
    edit: owner && (r.status === 'DRAFT' || r.status === 'INFO_REQUESTED'),
    submit: owner && r.status === 'DRAFT',
    respond: owner && r.status === 'INFO_REQUESTED',
    withdraw: owner && canTransition('T-07', r.status),
    pick: staff && user.role === 'REVIEWER' && r.status === 'SUBMITTED',
    assign: staff && user.role === 'SUPERVISOR' && r.status === 'SUBMITTED',
    reassign: staff && user.role === 'SUPERVISOR' && (r.status === 'IN_REVIEW' || r.status === 'INFO_REQUESTED'),
    requestInfo: decider && r.status === 'IN_REVIEW',
    requestInfoLimitReached: decider && r.status === 'IN_REVIEW' && r.infoCycles >= MAX_INFO_CYCLES,
    approve: decider && r.status === 'IN_REVIEW',
    reject: decider && r.status === 'IN_REVIEW',
    comment: r.status !== 'DRAFT' && (owner || staff),
    commentInternal: r.status !== 'DRAFT' && staff,
  };
}

export function requestDetail(deps: WorkflowDeps, user: PublicUser, id: number) {
  const r = Number.isInteger(id) ? findRequest(deps.db, id) : undefined;
  if (!r) throw problem('NOT_FOUND');
  assertCanView(user, { applicantId: r.applicantId, departmentId: r.departmentId, status: r.status }); // BR-18, PQ-20
  const isApplicant = user.role === 'APPLICANT';
  const declared = declaredDocuments(deps.db, r.id);
  const activity = activityFor(deps.db, r.id);
  const timeline = isApplicant ? timelineForApplicant(activity) : activity;
  const lastInfo = [...activity].reverse().find((a) => a.action === 'REQUEST_INFO');
  const rejection = [...activity].reverse().find((a) => a.action === 'REJECT');
  const comments = commentsFor(deps.db, r.id)
    .filter((c) => !isApplicant || c.visibility === 'PUBLIC')
    .map((c) => ({
      id: c.id, visibility: c.visibility, body: c.body, createdAt: c.createdAt, authorRole: c.authorRole,
      authorName: isApplicant && c.authorRole !== 'APPLICANT' ? (c.authorRole === 'SUPERVISOR' ? 'Supervisor' : 'Reviewer') : c.authorId === user.id ? 'You' : c.authorName,
    }));
  return {
    id: r.id, referenceNo: r.referenceNo, status: r.status,
    service: { id: r.serviceTypeId, code: r.serviceCode, name: r.serviceName, slaDays: r.slaDays, departmentId: r.departmentId },
    fields: FORM_FIELDS[r.serviceCode] ?? [],
    formData: JSON.parse(r.formData),
    documents: requiredDocuments(deps.db, r.serviceTypeId).map((d) => ({ typeCode: d.typeCode, label: d.label, mandatory: d.mandatory === 1, documentNumber: declared[d.typeCode] ?? null })),
    applicant: { id: r.applicantId, name: r.applicantName, nationalId: nationalIdFor(findNationalId(deps.db, r.applicantId) ?? '', user.id, { applicantId: r.applicantId, assigneeId: r.assigneeId }) },
    assignee: r.assigneeId === null ? null : isApplicant ? { id: null, name: 'Reviewer' } : { id: r.assigneeId, name: r.assigneeName },
    infoCycles: r.infoCycles, infoMessage: r.status === 'INFO_REQUESTED' ? lastInfo?.note ?? null : null,
    submittedAt: r.submittedAt, dueAt: r.dueAt, decidedAt: r.decidedAt, sla: sla(deps, r), workingDaysLeft: workingDaysLeft(deps, r),
    // BR-11 preview for drafts: "If submitted now, due …"
    dueIfSubmittedNow: r.status === 'DRAFT' ? computeDueAt(deps.clock.now(), r.slaDays, deps.timezone).toISOString() : null,
    rejectReason: r.rejectReason, rejectJustification: r.status === 'REJECTED' ? rejection?.note ?? null : null,
    certificate: certificate(deps, r),
    timeline, comments, actions: allowedActions(user, r),
  };
}

export function myRequests(deps: WorkflowDeps, user: PublicUser) {
  return listByApplicant(deps.db, user.id).map((r) => ({
    id: r.id, referenceNo: r.referenceNo, status: r.status, service: { code: r.serviceCode, name: r.serviceName },
    submittedAt: r.submittedAt, dueAt: r.dueAt, decidedAt: r.decidedAt, certificateNo: r.certificateNo, sla: sla(deps, r),
  }));
}

/** F-11 + F-17: department queue, non-DRAFT only, default open statuses (PQ-20), BR-13 sort. */
export function queue(deps: WorkflowDeps, user: PublicUser, q: { status?: unknown; service?: unknown }) {
  let statuses: readonly RequestStatus[] = OPEN_STATUSES;
  if (typeof q.status === 'string' && q.status !== '' && q.status !== 'open') {
    if (q.status === 'all') statuses = ['SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
    else if (isRequestStatus(q.status) && q.status !== 'DRAFT') statuses = [q.status];
    else throw invalid(['status']);
  }
  const service = typeof q.service === 'string' && q.service ? q.service.toUpperCase() : undefined;
  return listByDepartment(deps.db, user.departmentId!, statuses, service)
    .map((r) => ({
      id: r.id, referenceNo: r.referenceNo, status: r.status, service: { code: r.serviceCode, name: r.serviceName },
      applicantName: r.applicantName, assignee: r.assigneeId === null ? null : { id: r.assigneeId, name: r.assigneeName },
      submittedAt: r.submittedAt, dueAt: r.dueAt, sla: sla(deps, r), workingDaysLeft: workingDaysLeft(deps, r), infoCycles: r.infoCycles,
      actions: { pick: user.role === 'REVIEWER' && r.status === 'SUBMITTED', assign: user.role === 'SUPERVISOR' && r.status === 'SUBMITTED', reassign: user.role === 'SUPERVISOR' && (r.status === 'IN_REVIEW' || r.status === 'INFO_REQUESTED') },
    }))
    .sort(compareForQueue);
}

/** F-18: four numbers — open, at risk, overdue, active requests per reviewer (BR-12, PQ-13). */
export function dashboard(deps: WorkflowDeps, user: PublicUser) {
  const open = listByDepartment(deps.db, user.departmentId!, OPEN_STATUSES);
  const slas = open.map((r) => sla(deps, r));
  const dept = deps.db.prepare('SELECT id, name, maxActivePerReviewer AS limitPerReviewer FROM departments WHERE id = ?').get(user.departmentId) as { id: number; name: string; limitPerReviewer: number };
  return {
    department: { id: dept.id, name: dept.name },
    open: open.length,
    atRisk: slas.filter((s) => s === 'AT_RISK').length,
    overdue: slas.filter((s) => s === 'OVERDUE').length,
    reviewers: reviewersWithLoad(deps, user.departmentId!, dept.limitPerReviewer),
  };
}

export function reviewersWithLoad(deps: WorkflowDeps, departmentId: number, limit?: number) {
  const max = limit ?? (deps.db.prepare('SELECT maxActivePerReviewer AS n FROM departments WHERE id = ?').get(departmentId) as { n: number }).n;
  return listDepartmentReviewers(deps.db, departmentId).map((u) => ({ id: u.id, name: u.name, active: countActiveForReviewer(deps.db, u.id, ACTIVE_STATUSES), limit: max }));
}

/** BR-06: the signed-in reviewer's own active load, for the queue meter. */
export function myLoad(deps: WorkflowDeps, user: PublicUser) {
  const limit = (deps.db.prepare('SELECT maxActivePerReviewer AS n FROM departments WHERE id = ?').get(user.departmentId) as { n: number }).n;
  return { active: countActiveForReviewer(deps.db, user.id, ACTIVE_STATUSES), limit };
}
