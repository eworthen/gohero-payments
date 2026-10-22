export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'converted',
  'lost',
] as const

export const LEAD_STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  converted: 'Converted',
  lost: 'Lost',
}

export const LEAD_TYPES = ['merchant_processing', 'business_funding'] as const
export const FOLLOW_UP_STATUSES = ['pending', 'completed', 'cancelled'] as const