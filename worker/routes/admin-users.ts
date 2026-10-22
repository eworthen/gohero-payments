import { hasRole } from '../middleware/authorization'
import { idSchema, readJson, userPatchSchema } from '../middleware/validation'
import { badRequest, errorResponse, forbidden, json, notFound } from '../http'
import { auditStatement } from '../services/audit-service'
import type { ApiContext, User } from '../types'

export async function handleAdminUsers(context: ApiContext, path: string[]): Promise<Response> {
  if (!hasRole(context.user, 'administrator')) return forbidden()
  if (path.length === 0 && context.request.method === 'GET') {
    const users = await context.env.DB.prepare('SELECT id, email, display_name, role, active, created_at, updated_at FROM users ORDER BY display_name LIMIT 200').all()
    return json({ data: users.results })
  }

  const [userId] = path
  if (path.length !== 1 || !userId || context.request.method !== 'PATCH') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.')
  }
  if (!idSchema.safeParse(userId).success) return notFound()
  const parsed = await readJson(context.request, userPatchSchema)
  if (!parsed.success) return badRequest('User changes are invalid.')
  const target = await context.env.DB.prepare('SELECT id, role, active FROM users WHERE id = ?').bind(userId).first<Pick<User, 'id' | 'role' | 'active'>>()
  if (!target) return notFound()
  if (target.id === context.user.id && (parsed.data.active === false || parsed.data.role !== undefined)) {
    return badRequest('You cannot change your own role or deactivate your own account.')
  }

  const demotingActiveAdmin = target.role === 'administrator' && target.active === 1 && (parsed.data.role === 'sales_representative' || parsed.data.active === false)
  if (demotingActiveAdmin) {
    const otherAdmins = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'administrator' AND active = 1 AND id != ?").bind(userId).first<{ count: number }>()
    if (!otherAdmins || otherAdmins.count === 0) return badRequest('At least one active administrator must remain.')
  }

  const fields: string[] = []
  const values: Array<string | number> = []
  if (parsed.data.role) { fields.push('role = ?'); values.push(parsed.data.role) }
  if (parsed.data.active !== undefined) { fields.push('active = ?'); values.push(parsed.data.active ? 1 : 0) }
  fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
  const action = parsed.data.active === false ? 'user.deactivated' : parsed.data.role ? 'user.role_changed' : 'user.updated'
  await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values, userId),
    auditStatement(context.env.DB, { actorUserId: context.user.id, action, entityType: 'user', entityId: userId, metadata: { ...(parsed.data.role ? { role: parsed.data.role } : {}), ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}) } }),
  ])
  return json({ data: { id: userId, updated: true } })
}