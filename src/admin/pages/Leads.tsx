import { useEffect, useState } from 'react'
import { AlertCircle, Download, Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import LeadFilters, { type LeadFilterValues } from '../components/LeadFilters'
import LeadTable from '../components/LeadTable'
import { adminApi, ApiError } from '../services/api'
import type { AdminUser, Lead, PageResult } from '../types'

const initialFilters: LeadFilterValues = { search: '', lead_type: '', status: '', assigned_user_id: '', created_after: '', created_before: '' }

export default function Leads() {
  const { user } = useOutletContext<{ user: AdminUser }>()
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'created' | 'updated'>('created')
  const [result, setResult] = useState<PageResult<Lead> | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; display_name: string }>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const params = new URLSearchParams({ page: String(page), limit: '25', sort })
  for (const [key, value] of Object.entries(applied)) if (value) params.set(key, value)
  const query = params.toString()

  useEffect(() => {
    let active = true
    adminApi.get<PageResult<Lead>>(`/leads?${query}`)
      .then((data) => { if (active) { setResult(data); setError('') } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load leads.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, refreshKey])

  useEffect(() => {
    if (user.role !== 'administrator') return
    adminApi.get<Array<{ id: string; display_name: string }>>('/users')
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [user.role])

  async function exportCsv() {
    try {
      const response = await fetch('/api/admin/leads/export', { credentials: 'same-origin', headers: import.meta.env.DEV ? { 'X-Dev-User': 'admin' } : undefined })
      if (!response.ok) throw new ApiError(response.status, 'Lead export was not authorized.')
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'gohero-leads.csv'
      link.click()
      URL.revokeObjectURL(link.href)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Lead export failed.')
    }
  }

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    try {
      await adminApi.post('/leads', { ...data, assigned_user_id: data.assigned_user_id || null })
      setShowCreate(false)
      setPage(1)
      setRefreshKey((value) => value + 1)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Lead could not be created.')
    }
  }

  return (
    <>
      <div className="admin-page-heading"><div><h2>Lead records</h2><p>Search and manage assigned business inquiries.</p></div><div className="admin-heading-actions">{user.role === 'administrator' && <><button className="admin-button" type="button" onClick={() => void exportCsv()}><Download size={14} />Export</button><button className="admin-button admin-button-primary" type="button" onClick={() => setShowCreate(true)}><Plus size={15} />New lead</button></>}</div></div>
      {error && <div className="admin-error"><AlertCircle size={16} />{error}</div>}
      <LeadFilters values={filters} onChange={setFilters} onApply={() => { setPage(1); setApplied(filters) }} users={users} isAdministrator={user.role === 'administrator'} />
      {loading && !result ? <div className="admin-loading">Loading leads</div> : <LeadTable result={result} page={page} onPageChange={setPage} sort={sort} onSortChange={(value) => { setSort(value); setPage(1) }} />}
      {showCreate && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-lead-title"><h2 id="new-lead-title">Create lead</h2><form onSubmit={createLead}><div className="admin-form-grid">
        <div className="admin-field"><label htmlFor="lead-business">Business name</label><input className="admin-input" id="lead-business" name="business_name" required maxLength={160} /></div>
        <div className="admin-field"><label htmlFor="lead-contact">Contact name</label><input className="admin-input" id="lead-contact" name="contact_name" required maxLength={160} /></div>
        <div className="admin-field"><label htmlFor="lead-email">Email</label><input className="admin-input" id="lead-email" name="email" type="email" required maxLength={254} /></div>
        <div className="admin-field"><label htmlFor="lead-phone">Phone</label><input className="admin-input" id="lead-phone" name="phone" maxLength={40} /></div>
        <div className="admin-field"><label htmlFor="lead-type">Inquiry type</label><select className="admin-select" id="lead-type" name="lead_type"><option value="merchant_processing">Payment processing</option><option value="business_funding">Business funding</option></select></div>
        <div className="admin-field"><label htmlFor="lead-assignee">Assigned representative</label><select className="admin-select" id="lead-assignee" name="assigned_user_id"><option value="">Unassigned</option>{users.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select></div>
      </div><div className="admin-form-actions"><button className="admin-button" type="button" onClick={() => setShowCreate(false)}>Cancel</button><button className="admin-button admin-button-primary" type="submit">Create lead</button></div></form></section></div>}
    </>
  )
}