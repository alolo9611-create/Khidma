import type { RequestStatus, SlaStatus } from '../api/khidma';
import { SLA_LABEL, STATUS_CLASS, STATUS_LABEL } from './format';
import { Icon } from './Icon';

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`k-badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

const SLA_CLASS: Record<SlaStatus, string> = { ON_TRACK: 'sla-ok', AT_RISK: 'sla-risk', OVERDUE: 'sla-over' };
const SLA_ICON = { ON_TRACK: 'checkCircle', AT_RISK: 'clock', OVERDUE: 'alertTriangle' } as const;

/** Square SLA chip with an icon so it never reads as a status (HANDOFF §4). None for draft/decided/withdrawn. */
export function SlaBadge({ sla, suffix }: { sla: SlaStatus | null; suffix?: string }) {
  if (!sla) return null;
  return <span className={`k-sla ${SLA_CLASS[sla]}`}><Icon name={SLA_ICON[sla]} small />{SLA_LABEL[sla]}{suffix ? ` · ${suffix}` : ''}</span>;
}
