import { LEAD_STATUS_LABELS } from '../../lib/lead-config'
import type { LeadStatus } from '../types'

export default function LeadStatusBadge({ status }: { status: LeadStatus | string }) {
  const label = status in LEAD_STATUS_LABELS ? LEAD_STATUS_LABELS[status as LeadStatus] : status
  return <span className={`admin-badge status-${status}`}>{label}</span>
}