import { api } from './http';
import type { Role } from './auth';

export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'INFO_REQUESTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
export interface FieldDef { name: string; label: string; type: 'text' | 'integer' | 'date'; min: number; max: number }
export interface Service {
  id: number; code: string; name: string; slaDays: number; allowMultiple: boolean; isActive: boolean;
  department: { id: number; name: string };
  documents: { typeCode: string; label: string; mandatory: boolean }[];
  fields: FieldDef[];
}
export interface ActivityEntry { id: number; action: string; fromStatus: string | null; toStatus: string | null; note: string | null; at: string; actorName: string; actorRole: Role }
export interface CommentEntry { id: number; visibility: 'PUBLIC' | 'INTERNAL'; body: string; createdAt: string; authorRole: Role; authorName: string }
export interface Actions {
  edit: boolean; submit: boolean; respond: boolean; withdraw: boolean; pick: boolean; assign: boolean; reassign: boolean;
  requestInfo: boolean; requestInfoLimitReached: boolean; approve: boolean; reject: boolean; comment: boolean; commentInternal: boolean;
}
export interface RequestDetail {
  id: number; referenceNo: string | null; status: RequestStatus;
  service: { id: number; code: string; name: string; slaDays: number; departmentId: number };
  fields: FieldDef[]; formData: Record<string, string | number>;
  documents: { typeCode: string; label: string; mandatory: boolean; documentNumber: string | null }[];
  applicant: { id: number; name: string; nationalId: string };
  assignee: { id: number | null; name: string | null } | null;
  infoCycles: number; infoMessage: string | null;
  submittedAt: string | null; dueAt: string | null; decidedAt: string | null; sla: SlaStatus | null; workingDaysLeft: number | null;
  dueIfSubmittedNow: string | null;
  rejectReason: string | null; rejectJustification: string | null;
  certificate: { certificateNo: string; issuedOn: string; validUntil: string; status: 'VALID' | 'EXPIRED' } | null;
  timeline: ActivityEntry[]; comments: CommentEntry[]; actions: Actions;
}
export interface MyRequestRow {
  id: number; referenceNo: string | null; status: RequestStatus; service: { code: string; name: string };
  submittedAt: string | null; dueAt: string | null; decidedAt: string | null; certificateNo: string | null; sla: SlaStatus | null;
}
export interface QueueRow {
  id: number; referenceNo: string; status: RequestStatus; service: { code: string; name: string }; applicantName: string;
  assignee: { id: number; name: string } | null; submittedAt: string; dueAt: string; sla: SlaStatus | null; workingDaysLeft: number | null;
  infoCycles: number; actions: { pick: boolean; assign: boolean; reassign: boolean };
}
export interface Reviewer { id: number; name: string; active: number; limit: number }
export interface Dashboard { department: { id: number; name: string }; open: number; atRisk: number; overdue: number; reviewers: Reviewer[] }
export interface NotificationItem { id: number; message: string; link: string; readAt: string | null; createdAt: string }
export interface Verification { certificateNo: string; service: { name: string }; status: 'VALID' | 'EXPIRED'; issuedOn: string; validUntil: string }

const R = '/api/v1/requests';
export const khidma = {
  services: () => api<Service[]>('/api/v1/services'),
  service: (code: string) => api<Service>(`/api/v1/services/${encodeURIComponent(code)}`),
  myServices: () => api<Service[]>('/api/v1/services/mine'),
  updateService: (id: number, patch: { slaDays?: number; isActive?: boolean }) => api<Service>(`/api/v1/services/${id}`, { method: 'PATCH', body: patch }),

  myRequests: () => api<MyRequestRow[]>(`${R}/mine`),
  request: (id: number) => api<RequestDetail>(`${R}/${id}`),
  createDraft: (serviceCode: string) => api<RequestDetail>(R, { method: 'POST', body: { serviceCode } }),
  save: (id: number, body: { formData?: Record<string, unknown>; documents?: Record<string, string | null> }) => api<RequestDetail>(`${R}/${id}`, { method: 'PATCH', body }),
  submit: (id: number) => api<RequestDetail>(`${R}/${id}/submit`, { method: 'POST', body: {} }),
  withdraw: (id: number) => api<RequestDetail>(`${R}/${id}/withdraw`, { method: 'POST', body: { confirm: true } }),
  respond: (id: number, message: string) => api<RequestDetail>(`${R}/${id}/respond`, { method: 'POST', body: message ? { message } : {} }),
  pick: (id: number) => api<RequestDetail>(`${R}/${id}/pick`, { method: 'POST', body: {} }),
  assign: (id: number, reviewerId: number) => api<RequestDetail>(`${R}/${id}/assign`, { method: 'POST', body: { reviewerId } }),
  requestInfo: (id: number, message: string) => api<RequestDetail>(`${R}/${id}/request-info`, { method: 'POST', body: { message } }),
  approve: (id: number) => api<RequestDetail>(`${R}/${id}/approve`, { method: 'POST', body: {} }),
  reject: (id: number, reasonCode: string, justification: string) => api<RequestDetail>(`${R}/${id}/reject`, { method: 'POST', body: { reasonCode, justification } }),
  comment: (id: number, visibility: 'PUBLIC' | 'INTERNAL', body: string) => api<RequestDetail>(`${R}/${id}/comments`, { method: 'POST', body: { visibility, body } }),

  queue: (status: string, service: string) => api<QueueRow[]>(`/api/v1/queue?status=${encodeURIComponent(status)}&service=${encodeURIComponent(service)}`),
  myLoad: () => api<{ active: number; limit: number }>('/api/v1/me/load'),
  dashboard: () => api<Dashboard>('/api/v1/dashboard'),
  reviewers: () => api<Reviewer[]>('/api/v1/accounts/reviewers'),

  notifications: () => api<{ unread: number; items: NotificationItem[] }>('/api/v1/notifications'),
  readNotification: (id: number) => api<{ id: number; link: string }>(`/api/v1/notifications/${id}/read`, { method: 'POST', body: {} }),
  verify: (no: string) => api<Verification>(`/api/v1/verify/${encodeURIComponent(no)}`),
};
