import { useOutletContext } from 'react-router-dom'
import { AlertCircle, ArrowRight, Building2, CheckCircle2, CircleDollarSign, Clock3, FilePlus2, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminQuery } from '../hooks/useAdminQuery'
import type { AdminUser, FollowUp, LeadActivity } from '../types'

interface DashboardData {
  metrics: Record<string, number>
  recent_activity: Array<LeadActivity & { lead_id: string; business_name: string }>
  upcoming_follow_ups: FollowUp[]
}

const metricItems = [
  { key: 'total_leads', label: 'Total leads', icon: UsersRound },
  { key: 'new_leads', label: 'New leads', icon: FilePlus2 },
  { key: 'active_leads', label: 'Active pipeline', icon: Building2 },
  { key: 'converted_leads', label: 'Converted', icon: CheckCircle2 },
  { key: 'merchant_processing', label: 'Payment processing', icon: CircleDollarSign },
  { key: 'business_funding', label: 'Business funding', icon: Building2 },
  { key: 'overdue_follow_ups', label: 'Overdue follow-ups', icon: Clock3 },
]

export default function Dashboard() {
  const { user } = useOutletContext<{ user: AdminUser }>()
  const { data, error, loading } = useAdminQuery<DashboardData>('/dashboard')
  return (
    <>
      <div className="admin-page-heading"><div><h2>Good day, {user.display_name.split(' ')[0]}</h2><p>Current activity across your assigned work.</p></div><Link className="admin-button admin-button-primary" to="/admin/leads"><FilePlus2 size={14} />View leads</Link></div>
      {error && <div className="admin-error"><AlertCircle size={16} />{error}</div>}
      {loading && !data ? <div className="admin-loading">Loading dashboard</div> : <>
        <div className="admin-metric-grid">{metricItems.map(({ key, label, icon: Icon }) => <article className="admin-metric" key={key}><div className="admin-metric-top"><span>{label}</span><span className="admin-metric-icon"><Icon size={15} /></span></div><strong className="admin-metric-value">{data?.metrics[key] ?? 0}</strong></article>)}</div>
        <div className="admin-dashboard-grid">
          <section className="admin-panel"><div className="admin-panel-heading"><h3>Recent activity</h3><Link to="/admin/leads">Open leads <ArrowRight size={13} /></Link></div><div className="admin-panel-body">
            {data?.recent_activity.length ? data.recent_activity.map((item) => <div className="admin-activity-row" key={item.id}><span className="admin-activity-dot" /><div className="admin-activity-copy"><p><strong>{item.business_name}</strong> · {item.description}</p><small>{item.user_name} · {new Date(item.created_at).toLocaleString()}</small></div></div>) : <div className="admin-empty"><Clock3 size={20} /><strong>No recent activity</strong><span>Lead activity will appear here when updates are recorded.</span></div>}
          </div></section>
          <section className="admin-panel"><div className="admin-panel-heading"><h3>Upcoming follow-ups</h3><Link to="/admin/follow-ups">View all <ArrowRight size={13} /></Link></div><div className="admin-panel-body">
            {data?.upcoming_follow_ups.length ? data.upcoming_follow_ups.map((item) => <div className="admin-followup-row" key={item.id}><div><strong>{item.title}</strong><small>{item.business_name}</small></div><span className="admin-followup-date">{new Date(item.due_at).toLocaleDateString()}</span></div>) : <div className="admin-empty"><CheckCircle2 size={20} /><strong>Nothing due soon</strong><span>New follow-up tasks will be listed here.</span></div>}
          </div></section>
        </div>
      </>}
    </>
  )
}