import { hasRole } from '../middleware/authorization'
import { badRequest, forbidden, json } from '../http'
import type { ApiContext } from '../types'

function dateBounds(url: URL): { start?: string; end?: string } | null {
  const startValue = url.searchParams.get('start')
  const endValue = url.searchParams.get('end')
  const start = startValue ? Date.parse(startValue) : undefined
  const end = endValue ? Date.parse(endValue) : undefined
  if ((startValue && !Number.isFinite(start)) || (endValue && !Number.isFinite(end))) return null
  if (start !== undefined && end !== undefined && start > end) return null
  return {
    ...(start !== undefined ? { start: new Date(start).toISOString() } : {}),
    ...(end !== undefined ? { end: new Date(end).toISOString() } : {}),
  }
}

export async function handleAdminDashboard(context: ApiContext): Promise<Response> {
  const { env, user } = context
  const leadScope = user.role === 'administrator' ? '' : ' WHERE assigned_user_id = ?'
  const leadBindings = user.role === 'administrator' ? [] : [user.id]
  const [leads, types, overdue, recent, followUps] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count, SUM(CASE WHEN status NOT IN ('converted', 'lost') THEN 1 ELSE 0 END) AS active_count, SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS converted_count FROM leads${leadScope}`).bind(...leadBindings).first<Record<string, number>>(),
    env.DB.prepare(`SELECT lead_type, COUNT(*) AS count FROM leads${leadScope} GROUP BY lead_type`).bind(...leadBindings).all(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM follow_ups f JOIN leads l ON l.id = f.lead_id WHERE f.status = 'pending' AND f.due_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')${user.role === 'administrator' ? '' : ' AND f.assigned_user_id = ? AND l.assigned_user_id = ?'}`).bind(...(user.role === 'administrator' ? [] : [user.id, user.id])).first<{ count: number }>(),
    env.DB.prepare(`SELECT a.id, a.lead_id, a.activity_type, a.description, a.created_at, l.business_name, u.display_name AS user_name FROM lead_activities a JOIN leads l ON l.id = a.lead_id JOIN users u ON u.id = a.user_id ${user.role === 'administrator' ? '' : 'WHERE l.assigned_user_id = ?'} ORDER BY a.created_at DESC LIMIT 8`).bind(...leadBindings).all(),
    env.DB.prepare(`SELECT f.id, f.lead_id, f.title, f.due_at, l.business_name FROM follow_ups f JOIN leads l ON l.id = f.lead_id WHERE f.status = 'pending' AND f.due_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')${user.role === 'administrator' ? '' : ' AND f.assigned_user_id = ? AND l.assigned_user_id = ?'} ORDER BY f.due_at ASC LIMIT 8`).bind(...(user.role === 'administrator' ? [] : [user.id, user.id])).all(),
  ])
  return json({ data: {
    metrics: {
      total_leads: leads?.total ?? 0,
      new_leads: leads?.new_count ?? 0,
      active_leads: leads?.active_count ?? 0,
      converted_leads: leads?.converted_count ?? 0,
      merchant_processing: types.results.find((row) => row.lead_type === 'merchant_processing')?.count ?? 0,
      business_funding: types.results.find((row) => row.lead_type === 'business_funding')?.count ?? 0,
      overdue_follow_ups: overdue?.count ?? 0,
    },
    recent_activity: recent.results,
    upcoming_follow_ups: followUps.results,
  } })
}

export async function handleAdminReports(context: ApiContext): Promise<Response> {
  if (!hasRole(context.user, 'administrator')) return forbidden()
  const bounds = dateBounds(context.url)
  if (!bounds) return badRequest('Invalid reporting date range.')
  const clauses: string[] = []
  const values: string[] = []
  if (bounds.start) { clauses.push('created_at >= ?'); values.push(bounds.start) }
  if (bounds.end) { clauses.push('created_at <= ?'); values.push(bounds.end) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const [byStatus, byType, bySource, byAssignee, conversions, followUpCompletion] = await Promise.all([
    context.env.DB.prepare(`SELECT status AS name, COUNT(*) AS count FROM leads ${where} GROUP BY status`).bind(...values).all(),
    context.env.DB.prepare(`SELECT lead_type AS name, COUNT(*) AS count FROM leads ${where} GROUP BY lead_type`).bind(...values).all(),
    context.env.DB.prepare(`SELECT COALESCE(source, 'unspecified') AS name, COUNT(*) AS count FROM leads ${where} GROUP BY source ORDER BY count DESC LIMIT 50`).bind(...values).all(),
    context.env.DB.prepare(`SELECT COALESCE(u.display_name, 'Unassigned') AS name, COUNT(*) AS count FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id ${where.replaceAll('created_at', 'l.created_at')} GROUP BY l.assigned_user_id ORDER BY count DESC LIMIT 100`).bind(...values).all(),
    context.env.DB.prepare(`SELECT strftime('%Y-%m', updated_at) AS month, COUNT(*) AS count FROM leads WHERE status = 'converted' AND updated_at >= strftime('%Y-%m-01', 'now', '-11 months') ${bounds.start ? 'AND updated_at >= ?' : ''} ${bounds.end ? 'AND updated_at <= ?' : ''} GROUP BY month ORDER BY month`).bind(...[...(bounds.start ? [bounds.start] : []), ...(bounds.end ? [bounds.end] : [])]).all(),
    context.env.DB.prepare(`SELECT status AS name, COUNT(*) AS count FROM follow_ups ${bounds.start || bounds.end ? `WHERE ${[bounds.start ? 'created_at >= ?' : '', bounds.end ? 'created_at <= ?' : ''].filter(Boolean).join(' AND ')}` : ''} GROUP BY status`).bind(...[...(bounds.start ? [bounds.start] : []), ...(bounds.end ? [bounds.end] : [])]).all(),
  ])
  return json({ data: { by_status: byStatus.results, by_type: byType.results, by_source: bySource.results, by_assignee: byAssignee.results, conversions_over_time: conversions.results, follow_up_completion: followUpCompletion.results } })
}