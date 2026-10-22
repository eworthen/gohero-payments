import { useAdminQuery } from '../hooks/useAdminQuery'
import type { AdminUser } from '../types'
import { useOutletContext } from 'react-router-dom'
import { AlertCircle, BarChart3 } from 'lucide-react'
import { useState } from 'react'

interface ReportData {
  by_status: Array<{ name: string; count: number }>
  by_type: Array<{ name: string; count: number }>
  by_source: Array<{ name: string; count: number }>
  by_assignee: Array<{ name: string; count: number }>
  conversions_over_time: Array<{ month: string; count: number }>
  follow_up_completion: Array<{ name: string; count: number }>
}

function ReportBars({ title, rows }: { title: string; rows: Array<{ name: string; count: number }> }) {
  const maximum = Math.max(1, ...rows.map((row) => row.count))
  return <section className="admin-panel"><div className="admin-panel-heading"><h3>{title}</h3></div><div className="admin-report-bars">{rows.length ? rows.map((row) => <div className="admin-report-row" key={row.name}><div className="admin-report-label"><span>{row.name}</span><strong>{row.count}</strong></div><div className="admin-report-track"><span style={{ width: `${(row.count / maximum) * 100}%` }} /></div></div>) : <div className="admin-empty-state"><span>No records for this period.</span></div>}</div></section>
}

export default function Reports() {
  const { user } = useOutletContext<{ user: AdminUser }>()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const params = new URLSearchParams()
  if (start) params.set('start', new Date(`${start}T00:00:00Z`).toISOString())
  if (end) params.set('end', new Date(`${end}T23:59:59Z`).toISOString())
  const { data, error, loading } = useAdminQuery<ReportData>(`/reports${params.size ? `?${params}` : ''}`)

  if (user.role !== 'administrator') return <div className="admin-error"><AlertCircle size={16} />Reports are available to administrators only.</div>
  return <>
    <div className="admin-page-heading"><div><h2>Lead reports</h2><p>Operational counts from the current lead database.</p></div><BarChart3 size={20} /></div>
    <div className="admin-toolbar"><label className="admin-date-label">From<input className="admin-input" type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label className="admin-date-label">To<input className="admin-input" type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>
    {error && <div className="admin-error"><AlertCircle size={16} />{error}</div>}{loading && !data && <div className="admin-loading">Loading reports</div>}
    {data && <div className="admin-report-grid"><ReportBars title="Leads by status" rows={data.by_status.map((item) => ({ ...item, name: item.name.replaceAll('_', ' ') }))} /><ReportBars title="Leads by service" rows={data.by_type.map((item) => ({ ...item, name: item.name === 'merchant_processing' ? 'Payment processing' : 'Business funding' }))} /><ReportBars title="Lead source" rows={data.by_source} /><ReportBars title="Assigned representative" rows={data.by_assignee} /><ReportBars title="Monthly conversions" rows={data.conversions_over_time.map((item) => ({ name: item.month, count: item.count }))} /><ReportBars title="Follow-up completion" rows={data.follow_up_completion} /></div>}
  </>
}