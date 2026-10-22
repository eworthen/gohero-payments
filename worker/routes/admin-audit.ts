import { hasRole } from '../middleware/authorization'
import { badRequest, forbidden, json } from '../http'
import type { ApiContext } from '../types'

export async function handleAdminAudit(context: ApiContext): Promise<Response> {
  if (!hasRole(context.user, 'administrator')) return forbidden()
  const rawLimit = Number(context.url.searchParams.get('limit') ?? 50)
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, Math.floor(rawLimit))) : 50
  const cursor = context.url.searchParams.get('before')
  if (cursor && !Number.isFinite(Date.parse(cursor))) return badRequest('Invalid audit cursor.')
  const result = await context.env.DB.prepare(`SELECT a.id, a.actor_user_id, u.display_name AS actor_name, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at FROM audit_logs a JOIN users u ON u.id = a.actor_user_id ${cursor ? 'WHERE a.created_at < ?' : ''} ORDER BY a.created_at DESC LIMIT ?`).bind(...(cursor ? [new Date(cursor).toISOString(), limit] : [limit])).all()
  return json({ data: result.results })
}