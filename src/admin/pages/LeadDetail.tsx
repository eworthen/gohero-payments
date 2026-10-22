import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, CalendarClock, Plus, Save } from 'lucide-react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import ActivityTimeline from '../components/ActivityTimeline'
import LeadDetails from '../components/LeadDetails'
import LeadStatusBadge from '../components/LeadStatusBadge'
import { adminApi } from '../services/api'
import type { AdminUser, Lead } from '../types'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../lib/lead-config'

export default function LeadDetail() {
  const { leadId = '' } = useParams()
  const { user } = useOutletContext<{ user: AdminUser }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; display_name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    adminApi.get<{ data: Lead }>(`/leads/${leadId}`)
      .then(({ data }) => { if (active) { setLead(data); setError('') } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load lead.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [leadId, refresh])

  useEffect(() => {
    if (user.role !== 'administrator') return
    adminApi.get<Array<{ id: string; display_name: string }>>('/users').then(setUsers).catch(() => setUsers([]))
  }, [user.role])

  async function updateLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!lead) return
    const form = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await adminApi.patch(`/leads/${lead.id}`, {
        business_name: form.get('business_name'),
        contact_name: form.get('contact_name'),
        email: form.get('email'),
        phone: form.get('phone') || null,
        website: form.get('website') || null,
        business_state: form.get('business_state') || null,
        industry: form.get('industry') || null,
        status: form.get('status'),
        ...(user.role === 'administrator' ? { assigned_user_id: form.get('assigned_user_id') || null } : {}),
      })
      setRefresh((value) => value + 1)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Lead could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!lead || !note.trim()) return
    setSaving(true)
    try {
      await adminApi.post(`/leads/${lead.id}/notes`, { note: note.trim() })
      setNote('')
      setRefresh((value) => value + 1)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Note could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !lead) return <div className="admin-loading">Loading lead record</div>
  if (!lead) return <><div className="admin-error"><AlertCircle size={16} />{error || 'Lead not found.'}</div><Link className="admin-back-link" to="/admin/leads"><ArrowLeft size={14} />Back to leads</Link></>

  return (
    <>
      <div className="admin-page-heading"><div><Link className="admin-back-link" to="/admin/leads"><ArrowLeft size={13} />All leads</Link><h2>{lead.business_name}</h2><p>Created {new Date(lead.created_at).toLocaleString()} · Updated {new Date(lead.updated_at).toLocaleString()}</p></div><LeadStatusBadge status={lead.status} /></div>
      {error && <div className="admin-error"><AlertCircle size={16} />{error}</div>}
      <div className="admin-detail-grid">
        <div className="admin-detail-stack">
          <LeadDetails lead={lead} />
          <section className="admin-panel"><div className="admin-panel-heading"><h3>Notes</h3><span>{lead.notes?.length ?? 0}</span></div><div className="admin-detail-section">
            {lead.notes?.length ? lead.notes.map((item) => <article className="admin-note-item" key={item.id}><p>{item.note}</p><small>{item.user_name} · {new Date(item.created_at).toLocaleString()}</small></article>) : <div className="admin-empty"><span>No notes have been added.</span></div>}
            <form className="admin-note-form" onSubmit={addNote}><label className="admin-sr-only" htmlFor="lead-note">Add a note</label><textarea className="admin-textarea" id="lead-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} placeholder="Add an internal note…" required /><button className="admin-button admin-button-primary" disabled={saving || !note.trim()} type="submit"><Plus size={14} />Add note</button></form>
          </div></section>
        </div>
        <div className="admin-detail-stack">
          <section className="admin-panel"><div className="admin-panel-heading"><h3>Update lead</h3></div><div className="admin-detail-section"><form onSubmit={updateLead}>
            <div className="admin-form-grid">
              <div className="admin-field"><label htmlFor="edit-business-name">Business name</label><input className="admin-input" id="edit-business-name" name="business_name" defaultValue={lead.business_name} maxLength={160} required /></div>
              <div className="admin-field"><label htmlFor="edit-contact-name">Contact name</label><input className="admin-input" id="edit-contact-name" name="contact_name" defaultValue={lead.contact_name} maxLength={160} required /></div>
              <div className="admin-field"><label htmlFor="edit-email">Email</label><input className="admin-input" id="edit-email" name="email" type="email" defaultValue={lead.email} maxLength={254} required /></div>
              <div className="admin-field"><label htmlFor="edit-phone">Phone</label><input className="admin-input" id="edit-phone" name="phone" defaultValue={lead.phone ?? ''} maxLength={40} /></div>
              <div className="admin-field"><label htmlFor="edit-website">Website</label><input className="admin-input" id="edit-website" name="website" type="url" defaultValue={lead.website ?? ''} maxLength={200} /></div>
              <div className="admin-field"><label htmlFor="edit-business-state">State / region</label><input className="admin-input" id="edit-business-state" name="business_state" defaultValue={lead.business_state ?? ''} maxLength={80} /></div>
              <div className="admin-field"><label htmlFor="edit-industry">Industry</label><input className="admin-input" id="edit-industry" name="industry" defaultValue={lead.industry ?? ''} maxLength={120} /></div>
              <div className="admin-field"><label htmlFor="lead-status">Pipeline status</label><select id="lead-status" className="admin-select admin-full-width" name="status" defaultValue={lead.status}>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{LEAD_STATUS_LABELS[status]}</option>)}</select></div>
            </div>
            {user.role === 'administrator' && <div className="admin-field admin-top-gap"><label htmlFor="lead-owner">Assigned representative</label><select id="lead-owner" className="admin-select admin-full-width" name="assigned_user_id" defaultValue={lead.assigned_user_id ?? ''}><option value="">Unassigned</option>{users.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select></div>}
            <div className="admin-form-actions"><button className="admin-button admin-button-primary" type="submit" disabled={saving}><Save size={14} />Save changes</button></div>
          </form></div></section>
          <section className="admin-panel"><div className="admin-panel-heading"><h3>Follow-up tasks</h3><Link className="admin-inline-link" to="/admin/follow-ups">Manage</Link></div><div className="admin-detail-section">
            {lead.follow_ups?.length ? lead.follow_ups.map((task) => <article className="admin-followup-row" key={task.id}><div><strong>{task.title}</strong><small>{task.assigned_user_name} · due {new Date(task.due_at).toLocaleString()}</small></div><span className={`admin-badge status-${task.status}`}>{task.status}</span></article>) : <div className="admin-empty"><CalendarClock size={18} /><strong>No follow-up tasks</strong><span>Create and assign a follow-up from the follow-up page.</span></div>}
          </div></section>
          <section className="admin-panel"><div className="admin-panel-heading"><h3>Activity</h3></div><div className="admin-detail-section"><ActivityTimeline items={lead.activities ?? []} /></div></section>
        </div>
      </div>
    </>
  )
}