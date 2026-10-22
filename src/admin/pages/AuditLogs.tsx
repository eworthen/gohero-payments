import { useAdminQuery } from '../hooks/useAdminQuery'
import { AlertCircle, ClipboardList } from 'lucide-react'
import type { AdminUser } from '../types'
import { useOutletContext } from 'react-router-dom'

interface AuditRow {
  id: string
  actor_name: string
  action: string
  entity_type: string
  entity_id: string
  metadata: string
  created_at: string
}

export default function AuditLogs() {
  const { user } = useOutletContext<{ user: AdminUser }>()
  const { data, error, loading } = useAdminQuery<AuditRow[]>('/audit?limit=100')
  if (user.role !== 'administrator') return <div className="admin-error"><AlertCircle size={16} />Audit history is available to administrators only.</div>
  return <>
    <div className="admin-page-heading"><div><h2>Audit history</h2><p>Server-generated records of administrative and lead changes.</p></div><ClipboardList size={20} /></div>
    {error && <div className="admin-error"><AlertCircle size={16} />{error}</div>}
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Actor</th><th>Target</th><th>Details</th><th>Timestamp</th></tr></thead><tbody>{data?.map((row) => <tr key={row.id}><td><span className="admin-table-primary">{row.action}</span></td><td>{row.actor_name}</td><td>{row.entity_type} · <span className="admin-mono">{row.entity_id}</span></td><td><code className="admin-audit-metadata">{row.metadata}</code></td><td>{new Date(row.created_at).toLocaleString()}</td></tr>)}</tbody></table>{loading && !data && <div className="admin-loading">Loading audit history</div>}{data?.length === 0 && <div className="admin-empty-state"><ClipboardList size={20} /><strong>No audit events</strong><span>Recorded changes will appear here.</span></div>}</div></section>
  </>
}