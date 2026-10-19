// BR-14 + PQ-22: every status change notifies the applicant (including their own actions);
// supervisor assign/reassign notifies the new reviewer; a self-pick does not (BR-05 separates pick from assign).
export type NotifyEvent = 'SUBMITTED' | 'IN_REVIEW' | 'INFO_REQUESTED' | 'RESPONDED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'ASSIGNED';

export function notificationMessage(event: NotifyEvent, ref: string, certificateNo?: string | null): string {
  switch (event) {
    case 'SUBMITTED': return `Your request ${ref} was submitted.`;
    case 'IN_REVIEW': return `Your request ${ref} is now in review.`;
    case 'INFO_REQUESTED': return `More information is needed for request ${ref}.`;
    case 'RESPONDED': return `Your response for request ${ref} was sent.`;
    case 'APPROVED': return `Your request ${ref} was approved. Certificate ${certificateNo}.`;
    case 'REJECTED': return `Your request ${ref} was rejected.`;
    case 'WITHDRAWN': return `Your request ${ref} was withdrawn.`;
    case 'ASSIGNED': return `Request ${ref} was assigned to you.`;
  }
}

export const applicantLink = (requestId: number) => `/applicant/requests/${requestId}`;
export const staffLink = (requestId: number) => `/staff/requests/${requestId}`;
