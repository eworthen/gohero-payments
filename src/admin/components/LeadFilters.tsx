import { Search, SlidersHorizontal } from 'lucide-react'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../lib/lead-config'

export interface LeadFilterValues {
  search: string
  lead_type: string
  status: string
  assigned_user_id: string
  created_after: string
  created_before: string
}

interface LeadFiltersProps {
  values: LeadFilterValues
  onChange: (values: LeadFilterValues) => void
  onApply: () => void
  users: Array<{ id: string; display_name: string }>
  isAdministrator: boolean
}

export default function LeadFilters({ values, onChange, onApply, users, isAdministrator }: LeadFiltersProps) {
  function update(key: keyof LeadFilterValues, value: string) {
    onChange({ ...values, [key]: value })
  }
  return (
    <form className="admin-filter-panel" onSubmit={(event) => { event.preventDefault(); onApply() }}>
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={15} /><input aria-label="Search business, contact, or email" value={values.search} onChange={(event) => update('search', event.target.value)} placeholder="Search business, contact, email" /></label>
        <select className="admin-select" aria-label="Filter by lead type" value={values.lead_type} onChange={(event) => update('lead_type', event.target.value)}><option value="">All services</option><option value="merchant_processing">Payment processing</option><option value="business_funding">Business funding</option></select>
        <select className="admin-select" aria-label="Filter by status" value={values.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{LEAD_STATUS_LABELS[status]}</option>)}</select>
        {isAdministrator && <select className="admin-select" aria-label="Filter by assigned user" value={values.assigned_user_id} onChange={(event) => update('assigned_user_id', event.target.value)}><option value="">All representatives</option>{users.map((user) => <option key={user.id} value={user.id}>{user.display_name}</option>)}</select>}
        <button type="submit" className="admin-button"><SlidersHorizontal size={14} />Apply filters</button>
      </div>
      <details className="admin-date-filters"><summary>Creation date range</summary><div className="admin-toolbar"><label className="admin-date-label">From<input className="admin-input" type="date" value={values.created_after} onChange={(event) => update('created_after', event.target.value)} /></label><label className="admin-date-label">To<input className="admin-input" type="date" value={values.created_before} onChange={(event) => update('created_before', event.target.value)} /></label><button type="submit" className="admin-button">Apply dates</button></div></details>
    </form>
  )
}