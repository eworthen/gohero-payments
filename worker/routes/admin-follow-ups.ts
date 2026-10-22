import { canAccessAssignedRecord, hasRole } from '../middleware/authorization'
import { followUpCreateSchema, followUpPatchSchema, readJson } from '../middleware/validation'
import { badRequest, errorResponse, forbidden, json, notFound } from '../http'
import { activityStatement, auditStatement } from '../services/audit-service'
import type { ApiContext } from '../types'

export async function handleAdminFollowUps(context: ApiContext, path: string[]): Promise<Response> {
  const { env, user, request, url } = context

  if (path.length === 0 && request.method === 'GET') {
    const clauses: string[] = []
    const values: Array<string> = []
    if (user.role === 'sales_representative') {
      clauses.push('f.assigned_user_id = ?', 'l.assigned_user_id = ?')
      values.push(user.id, user.id)
    } else if (url.searchParams.has('assigned_user_id')) {
      clauses.push('f.assigned_user_id = ?')
      values.push(url.searchParams.get('assigned_user_id') ?? '')
    }
    const range = url.searchParams.get('range')
    if (range === 'overdue') clauses.push("f.status = 'pending' AND f.due_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
    if (range === 'upcoming') clauses.push("f.status = 'pending' AND f.due_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
    if (range && !['overdue', 'upcoming', 'all'].includes(range)) return badRequest('Invalid follow-up range.')
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const result = await env.DB.prepare(`SELECT f.id, f.lead_id, f.assigned_user_id, u.display_name AS assigned_user_name, l.business_name, f.title, f.due_at, f.completed_at, f.status, f.created_at, f.updated_at FROM follow_ups f JOIN leads l ON l.id = f.lead_id JOIN users u ON u.id = f.assigned_user_id ${where} ORDER BY CASE WHEN f.status = 'pending' THEN 0 ELSE 1 END, f.due_at ASC LIMIT 200`).bind(...values).all()
    return json({ data: result.results })
  }

  if (path.length === 0 && request.method === 'POST') {
    const parsed = await readJson(request, followUpCreateSchema)
    if (!parsed.success) return badRequest('Follow-up information is invalid.')
    const input = parsed.data
    if (user.role === 'sales_representative' && input.assigned_user_id && input.assigned_user_id !== user.id) return forbidden()
    const lead = await env.DB.prepare('SELECT id, assigned_user_id FROM leads WHERE id = ?').bind(input.lead_id).first<{ id: string; assigned_user_id: string | null }>()
    if (!lead || !canAccessAssignedRecord(user, lead.assigned_user_id)) return notFound()
    const assignedUserId = user.role === 'sales_representative' ? user.id : input.assigned_user_id ?? lead.assigned_user_id
    if (!assignedUserId) return badRequest('A follow-up assignee is required.')
    const assignee = await env.DB.prepare('SELECT id FROM users WHERE id = ? AND active = 1').bind(assignedUserId).first()
    if (!assignee) return badRequest('The assigned user is unavailable.')

    const id = crypto.randomUUID()
    await env.DB.batch([
      env.DB.prepare('INSERT INTO follow_ups (id, lead_id, assigned_user_id, title, due_at) VALUES (?, ?, ?, ?, ?)').bind(id, input.lead_id, assignedUserId, input.title, new Date(input.due_at).toISOString()),
      activityStatement(env.DB, { leadId: input.lead_id, userId: user.id, type: 'follow_up_created', description: 'A follow-up task was created.' }),
      auditStatement(env.DB, { actorUserId: user.id, action: 'follow_up.created', entityType: 'follow_up', entityId: id, metadata: { lead_id: input.lead_id, assigned_user_id: assignedUserId } }),
    ])
    return json({ data: { id } }, 201)
  }

  const [followUpId] = path
  if (path.length === 1 && followUpId && request.method === 'PATCH') {
    const parsed = await readJson(request, followUpPatchSchema)
    if (!parsed.success) return badRequest('Follow-up status is invalid.')
    const task = await env.DB.prepare('SELECT id, lead_id, assigned_user_id FROM follow_ups WHERE id = ?').bind(followUpId).first<{ id: string; lead_id: string; assigned_user_id: string }>()
    if (!task) return notFound()
    if (!hasRole(user, 'administrator') && task.assigned_user_id !== user.id) return notFound()
    const lead = await env.DB.prepare('SELECT assigned_user_id FROM leads WHERE id = ?').bind(task.lead_id).first<{ assigned_user_id: string | null }>()
    if (!lead || !canAccessAssignedRecord(user, lead.assigned_user_id)) return notFound()
    const completedAt = parsed.data.status === 'completed' ? new Date().toISOString() : null
    await env.DB.batch([
      env.DB.prepare("UPDATE follow_ups SET status = ?, completed_at = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").bind(parsed.data.status, completedAt, followUpId),
      activityStatement(env.DB, { leadId: task.lead_id, userId: user.id, type: 'follow_up_updated', description: `Follow-up marked ${parsed.data.status}.` }),
      auditStatement(env.DB, { actorUserId: user.id, action: 'follow_up.updated', entityType: 'follow_up', entityId: followUpId, metadata: { status: parsed.data.status } }),
    ])
    return json({ data: { id: followUpId, status: parsed.data.status } })
  }

  return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.')
}