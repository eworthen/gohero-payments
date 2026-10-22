import { useEffect, useState } from 'react'
import { AlertCircle, CalendarClock, Check, Plus } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import LeadStatusBadge from '../components/LeadStatusBadge'
import { useAdminQuery } from '../hooks/useAdminQuery'
import { adminApi } from '../services/api'
import type { AdminUser, FollowUp, Lead, PageResult } from '../types'

export default function FollowUps() {
  const { user } = useOutletContext<{ user: AdminUser }>()
  const [range, setRange] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)
  const { data, error, loading } = useAdminQuery<FollowUp[]>(`/follow-ups?range=${range}`, reloadKey)
  const [leads, setLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<Array<{ id: string; display_name: string }>>([])
  const [showCreate, setShowCreate] = useState(false)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')

  useEffect(() => {
    adminApi.get<PageResult<Lead>>('/leads?limit=100&sort=updated').then((result) => setLeads(result.data)).catch(() => setLeads([]))
  }, [])

  useEffect(() => {
    if (user.role !== 'administrator') return
    adminApi.get<Array<{ id: string; display_name: string }>>('/users').then(setUsers).catch(() => setUsers([]))
  }, [user.role])

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    try {
      await adminApi.post('/follow-ups', {
        lead_id: values.get('lead_id'),
        title: values.get('title'),
        due_at: new Date(String(values.get('due_at'))).toISOString(),
        ...(values.get('assigned_user_id') ? { assigned_user_id: values.get('assigned_user_id') } : {}),
      })
      setShowCreate(false)
      setReloadKey((value) => value + 1)
      setMessage('Follow-up created.')
      setFailure('')
    } catch (reason) {
      setFailure(reason instanceof Error ? reason.message : 'Follow-up could not be created.')
    }
  }

  async function updateTask(task: FollowUp) {
    try {
      await adminApi.patch(`/follow-ups/${task.id}`, { status: 'completed' })
      setReloadKey((value) => value + 1)
      setMessage('Follow-up marked complete.')
      setFailure('')
    } catch (reason) {
      setFailure(reason instanceof Error ? reason.message : 'Follow-up could not be updated.')
    }
  }

  return <>
    <div className="admin-page-heading"><div><h2>Follow-up tasks</h2><p>Keep assigned lead conversations moving.</p></div><button className="admin-button admin-button-primary" type="button" onClick={() => setShowCreate(true)}><Plus size={15} />New follow-up</button></div>
    {error && <div className="admin-error"><AlertCircle size={16} />{error}</div>}{failure && <div className="admin-error"><AlertCircle size={16} />{failure}</div>}{message && <div className="admin-success">{message}</div>}
    <div className="admin-toolbar"><label className="admin-sr-only" htmlFor="follow-range">Filter tasks</label><select id="follow-range" className="admin-select" value={range} onChange={(event) => setRange(event.target.value)}><option value="all">All tasks</option><option value="overdue">Overdue</option><option value="upcoming">Upcoming</option></select></div>
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Task</th><th>Lead</th><th>Assigned to</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {data?.map((task) => <tr key={task.id}><td><span className="admin-table-primary">{task.title}</span></td><td><Link to={`/admin/leads/${task.lead_id}`}>{task.business_name}</Link></td><td>{task.assigned_user_name}</td><td>{new Date(task.due_at).toLocaleString()}</td><td><LeadStatusBadge status={task.status} /></td><td>{task.status === 'pending' ? <button className="admin-icon-control" type="button" aria-label={`Mark ${task.title} complete`} onClick={() => void updateTask(task)}><Check size={15} /></button> : '—'}</td></tr>)}
    </tbody></table>{loading && !data && <div className="admin-loading">Loading follow-ups</div>}{data?.length === 0 && <div className="admin-empty-state"><CalendarClock size={21} /><strong>No follow-ups in this view</strong><span>Create a task from a lead or start with a new follow-up.</span></div>}</div></section>
    {showCreate && <div className="admin-modal-backdrop" onKeyDown={(event) => { if (event.key === 'Escape') setShowCreate(false) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="follow-title"><h2 id="follow-title">Create follow-up</h2><form onSubmit={createTask}><div className="admin-form-grid"><div className="admin-field admin-span-two"><label htmlFor="follow-lead">Lead</label><select className="admin-select" id="follow-lead" name="lead_id" required defaultValue=""><option value="" disabled>Select a lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.business_name} · {lead.contact_name}</option>)}</select></div><div className="admin-field admin-span-two"><label htmlFor="follow-task-title">Task title</label><input className="admin-input" id="follow-task-title" name="title" maxLength={180} required autoFocus /></div><div className="admin-field"><label htmlFor="follow-due">Due date and time</label><input className="admin-input" id="follow-due" name="due_at" type="datetime-local" required /></div><div className="admin-field"><label htmlFor="follow-assignee">Assignee</label><select className="admin-select" id="follow-assignee" name="assigned_user_id" disabled={user.role !== 'administrator'} defaultValue={user.id}>{user.role === 'administrator' ? users.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>) : <option value={user.id}>{user.display_name}</option>}</select></div></div><div className="admin-form-actions"><button className="admin-button" type="button" onClick={() => setShowCreate(false)}>Cancel</button><button className="admin-button admin-button-primary" type="submit">Create task</button></div></form></section></div>}
  </>
}