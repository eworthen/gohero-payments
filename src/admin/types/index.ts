export type AdminRole = 'administrator' | 'sales_representative'
export type LeadType = 'merchant_processing' | 'business_funding'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'converted' | 'lost'

export interface AdminUser {
  id: string
  email: string
  display_name: string
  role: AdminRole
}

export interface Lead {
  id: string
  lead_type: LeadType
  business_name: string
  contact_name: string
  email: string
  phone: string | null
  website: string | null
  business_state: string | null
  industry: string | null
  status: LeadStatus
  source: string | null
  assigned_user_id: string | null
  assigned_user_name: string | null
  created_at: string
  updated_at: string
  notes?: LeadNote[]
  activities?: LeadActivity[]
  follow_ups?: FollowUp[]
  estimated_monthly_processing_volume_cents?: number | null
  current_processor?: string | null
  years_in_business?: number | null
  estimated_monthly_revenue_cents?: number | null
  funding_amount_requested_cents?: number | null
  additional_information?: string | null
}

export interface LeadNote {
  id: string
  user_id: string
  user_name: string
  note: string
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  user_id: string
  user_name: string
  activity_type: string
  description: string
  created_at: string
}

export interface FollowUp {
  id: string
  lead_id: string
  assigned_user_id: string
  assigned_user_name: string
  business_name: string
  title: string
  due_at: string
  completed_at: string | null
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
}

export interface PageResult<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number }
}