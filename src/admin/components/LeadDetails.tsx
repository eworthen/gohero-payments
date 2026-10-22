import { Mail, MapPin, Phone, Store } from 'lucide-react'
import LeadStatusBadge from './LeadStatusBadge'
import type { Lead } from '../types'

export default function LeadDetails({ lead }: { lead: Lead }) {
  const info = [
    ['Contact', lead.contact_name],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Website', lead.website],
    ['State / region', lead.business_state],
    ['Industry', lead.industry],
    ['Lead source', lead.source],
    ['Assigned representative', lead.assigned_user_name],
  ] as const
  return (
    <section className="admin-panel">
      <div className="admin-detail-section">
        <div className="admin-lead-title"><span className="admin-large-icon"><Store size={19} /></span><div><h2>{lead.business_name}</h2><p>{lead.lead_type === 'merchant_processing' ? 'Payment processing' : 'Business funding'} inquiry</p></div><LeadStatusBadge status={lead.status} /></div>
      </div>
      <div className="admin-detail-section"><h3>Business and contact</h3><div className="admin-info-grid">{info.map(([label, value], index) => <div className="admin-info-item" key={label}><small>{label}</small><span>{index === 1 && value ? <><Mail size={12} /> {value}</> : index === 2 && value ? <><Phone size={12} /> {value}</> : index === 4 && value ? <><MapPin size={12} /> {value}</> : value || 'Not provided'}</span></div>)}</div></div>
      {(lead.estimated_monthly_processing_volume_cents != null || lead.estimated_monthly_revenue_cents != null || lead.funding_amount_requested_cents != null || lead.years_in_business != null || lead.current_processor || lead.additional_information) && <div className="admin-detail-section"><h3>Additional business details</h3><div className="admin-info-grid">
        {lead.estimated_monthly_processing_volume_cents != null && <div className="admin-info-item"><small>Estimated monthly processing volume</small><span>{(lead.estimated_monthly_processing_volume_cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>}
        {lead.estimated_monthly_revenue_cents != null && <div className="admin-info-item"><small>Estimated monthly revenue</small><span>{(lead.estimated_monthly_revenue_cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>}
        {lead.funding_amount_requested_cents != null && <div className="admin-info-item"><small>Funding amount requested</small><span>{(lead.funding_amount_requested_cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>}
        {lead.years_in_business != null && <div className="admin-info-item"><small>Years in business</small><span>{lead.years_in_business}</span></div>}
        {lead.current_processor && <div className="admin-info-item"><small>Current processor</small><span>{lead.current_processor}</span></div>}
        {lead.additional_information && <div className="admin-info-item"><small>Additional information</small><span>{lead.additional_information}</span></div>}
      </div></div>}
    </section>
  )
}