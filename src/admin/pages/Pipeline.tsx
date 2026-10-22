import { useState } from 'react'
import { AlertCircle, Columns3, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminQuery } from '../hooks/useAdminQuery'
import { adminApi } from '../services/api'
import type { Lead, PageResult } from '../types'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../lib/lead-config'

const stages: Array<{ id: Lead['status']; label: string }> = LEAD_STATUSES.map((id) => ({ id, label: LEAD_STATUS_LABELS[id] }))

export default function Pipeline() {
  const [reloadKey, setReloadKey] = useState(0)
  const { data, error, loading } = useAdminQuery<PageResult<Lead>>('/leads?limit=100&sort=updated', reloadKey)
  const [saveError, setSaveError] = useState('')

  async function changeStatus(leadId: string, status: string) {
    try {
      await adminApi.patch(`/leads/${leadId}`, { status })
      setSaveError('')
      setReloadKey((value) => value + 1)
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : 'Status could not be changed.')
    }
  }

  return <>
    <div className="admin-page-heading"><div><h2>Sales pipeline</h2><p>{data?.pagination.total ?? 0} leads · showing up to 100 most recently updated records</p></div><button type="button" className="admin-button" onClick={() => setReloadKey((value) => value + 1)}><RefreshCw size={14} />Refresh</button></div>
    {(error || saveError) && <div className="admin-error"><AlertCircle size={16} />{saveError || error}</div>}
    {loading && !data ? <div className="admin-loading">Loading pipeline</div> : <div className="admin-kanban" aria-label="Lead pipeline stages">
      {stages.map((stage) => {
        const leads = data?.data.filter((lead) => lead.status === stage.id) ?? []
        return <section className="admin-kanban-column" key={stage.id} aria-label={`${stage.label}, ${leads.length} leads`}><div className="admin-kanban-heading"><span>{stage.label}</span><span className="admin-kanban-count">{leads.length}</span></div>
          {leads.map((lead) => <article className="admin-lead-card" key={lead.id}><span className={`lead-type-dot ${lead.lead_type === 'business_funding' ? 'lead-type-funding' : ''}`} />{lead.lead_type === 'merchant_processing' ? 'Processing' : 'Funding'}<Link to={`/admin/leads/${lead.id}`}><strong>{lead.business_name}</strong></Link><small>{lead.contact_name} · {lead.assigned_user_name ?? 'Unassigned'}</small><small>Updated {new Date(lead.updated_at).toLocaleDateString()}</small><label className="admin-sr-only" htmlFor={`status-${lead.id}`}>Change {lead.business_name} stage</label><select id={`status-${lead.id}`} value={lead.status} onChange={(event) => void changeStatus(lead.id, event.target.value)} aria-label={`Change ${lead.business_name} stage`}>{stages.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></article>)}
          {leads.length === 0 && <div className="admin-kanban-empty">No leads</div>}
        </section>
      })}
    </div>}
    {data?.pagination.total && data.pagination.total > data.data.length ? <div className="admin-info-banner"><Columns3 size={15} />The board shows a bounded page. Use the lead list to search and navigate the complete set.</div> : null}
  </>
}