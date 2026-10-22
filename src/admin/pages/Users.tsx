import { useState } from 'react'
import { AlertCircle, ShieldCheck, UserRoundCog } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useAdminQuery } from '../hooks/useAdminQuery'
import { adminApi } from '../services/api'
import type { AdminUser } from '../types'

interface ManagedUser extends AdminUser {
  active: number
  created_at: string
}

export default function Users() {
  const { user } = useOutletContext<{ user: AdminUser }>()
  const [reloadKey, setReloadKey] = useState(0)
  const { data, error, loading } = useAdminQuery<ManagedUser[]>('/users', reloadKey)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')

  async function changeUser(target: ManagedUser, patch: { role?: string; active?: boolean }) {
    const action = patch.active === false ? 'deactivate this user' : `change ${target.display_name}'s role`
    if (!window.confirm(`Confirm you want to ${action}?`)) return
    try {
      await adminApi.patch(`/users/${target.id}`, patch)
      setReloadKey((value) => value + 1)
      setMessage('User access updated.')
      setFailure('')
    } catch (reason) {
      setFailure(reason instanceof Error ? reason.message : 'User access could not be changed.')
    }
  }

  if (user.role !== 'administrator') return <div className="admin-error"><AlertCircle size={16} />User management is available to administrators only.</div>
  return <>
    <div className="admin-page-heading"><div><h2>User access</h2><p>Manage active portal identities and their minimum required role.</p></div><span className="admin-security-note"><ShieldCheck size={16} />Cloudflare Access protected</span></div>
    {error && <div className="admin-error"><AlertCircle size={16} />{error}</div>}{failure && <div className="admin-error"><AlertCircle size={16} />{failure}</div>}{message && <div className="admin-success">{message}</div>}
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead><tbody>
      {data?.map((target) => <tr key={target.id}><td><span className="admin-table-primary">{target.display_name}</span><span className="admin-table-secondary">{target.email}</span></td><td><select className="admin-select" aria-label={`Role for ${target.display_name}`} value={target.role} disabled={target.id === user.id || !target.active} onChange={(event) => void changeUser(target, { role: event.target.value })}><option value="administrator">Administrator</option><option value="sales_representative">Sales representative</option></select></td><td><span className={`admin-badge ${target.active ? 'status-qualified' : 'status-lost'}`}>{target.active ? 'Active' : 'Inactive'}</span></td><td>{new Date(target.created_at).toLocaleDateString()}</td><td>{target.active && target.id !== user.id ? <button className="admin-button admin-button-danger" type="button" onClick={() => void changeUser(target, { active: false })}><UserRoundCog size={13} />Deactivate</button> : '—'}</td></tr>)}
      </tbody></table>{loading && !data && <div className="admin-loading">Loading users</div>}{data?.length === 0 && <div className="admin-empty-state"><UserRoundCog size={20} /><strong>No provisioned users</strong><span>Add users through the documented identity bootstrap procedure.</span></div>}</div></section>
    <p className="admin-footnote">New users are not automatically enrolled or granted roles. Provision the Cloudflare Access subject ID and assigned role using the controlled bootstrap procedure in the README.</p>
  </>
}