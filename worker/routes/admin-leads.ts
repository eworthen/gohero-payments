import { canAccessAssignedRecord, hasRole } from '../middleware/authorization'
import { idSchema, leadCreateSchema, leadPatchSchema, leadStatusSchema, noteSchema, readJson } from '../middleware/validation'
import { badRequest, errorResponse, forbidden, json, notFound } from '../http'
import { activityStatement, auditStatement } from '../services/audit-service'
import type { ApiContext } from '../types'

type SqlValue = string | number | null | boolean

interface LeadRow {
  id: string
  lead_type: 'merchant_processing' | 'business_funding'
  business_name: string
  contact_name: string
  email: string
  phone: string | null
  website: string | null
  business_state: string | null
  industry: string | null
  status: string
  source: string | null
  assigned_user_id: string | null
  assigned_user_name: string | null
  created_at: string
  updated_at: string
}

function escapeLike(value: string): string {
  return value.replace(/[!%_]/g, '!$&')
}

async function listLeads(context: ApiContext): Promise<Response> {
  const { url, env, user } = context
  const page = Math.min(100_000, Math.max(1, Math.floor(Number(url.searchParams.get('page') ?? 1) || 1)))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 25) || 25))
  const offset = (page - 1) * limit
  const clauses: string[] = []
  const values: SqlValue[] = []

  if (user.role === 'sales_representative') {
    clauses.push('l.assigned_user_id = ?')
    values.push(user.id)
  } else if (url.searchParams.has('assigned_user_id')) {
    const assignedId = idSchema.safeParse(url.searchParams.get('assigned_user_id'))
    if (!assignedId.success) return badRequest('Invalid assigned user filter.')
    clauses.push('l.assigned_user_id = ?')
    values.push(assignedId.data)
  }

  const leadType = url.searchParams.get('lead_type')
  if (leadType) {
    if (leadType !== 'merchant_processing' && leadType !== 'business_funding') return badRequest('Invalid lead type filter.')
    clauses.push('l.lead_type = ?')
    values.push(leadType)
  }

  const status = url.searchParams.get('status')
  if (status) {
    const parsed = leadStatusSchema.safeParse(status)
    if (!parsed.success) return badRequest('Invalid status filter.')
    clauses.push('l.status = ?')
    values.push(parsed.data)
  }

  const createdAfter = url.searchParams.get('created_after')
  const createdBefore = url.searchParams.get('created_before')
  if (createdAfter) {
    const parsed = Date.parse(createdAfter)
    if (!Number.isFinite(parsed)) return badRequest('Invalid creation date filter.')
    clauses.push('l.created_at >= ?')
    values.push(new Date(parsed).toISOString())
  }
  if (createdBefore) {
    const parsed = Date.parse(createdBefore)
    if (!Number.isFinite(parsed)) return badRequest('Invalid creation date filter.')
    clauses.push('l.created_at <= ?')
    values.push(new Date(parsed).toISOString())
  }

  const search = url.searchParams.get('search')?.trim().slice(0, 120)
  if (search) {
    const pattern = `%${escapeLike(search)}%`
    clauses.push("(l.business_name LIKE ? ESCAPE '!' OR l.contact_name LIKE ? ESCAPE '!' OR l.email LIKE ? ESCAPE '!')")
    values.push(pattern, pattern, pattern)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const sort = url.searchParams.get('sort') === 'updated' ? 'l.updated_at' : 'l.created_at'
  const [countResult, leadResult] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS total FROM leads l ${where}`).bind(...values).first<{ total: number }>(),
    env.DB.prepare(
      `SELECT l.id, l.lead_type, l.business_name, l.contact_name, l.email, l.phone, l.website, l.business_state, l.industry, l.status, l.source, l.assigned_user_id, u.display_name AS assigned_user_name, l.created_at, l.updated_at FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id ${where} ORDER BY ${sort} DESC LIMIT ? OFFSET ?`,
    ).bind(...values, limit, offset).all<LeadRow>(),
  ])

  return json({ data: leadResult.results, pagination: { page, limit, total: countResult?.total ?? 0 } })
}

async function createLead(context: ApiContext): Promise<Response> {
  const { request, env, user } = context
  if (!hasRole(user, 'administrator')) return forbidden()
  const parsed = await readJson(request, leadCreateSchema)
  if (!parsed.success) return badRequest('Lead information is invalid.')
  const input = parsed.data

  if (input.assigned_user_id) {
    const assignee = await env.DB.prepare('SELECT id FROM users WHERE id = ? AND active = 1').bind(input.assigned_user_id).first()
    if (!assignee) return badRequest('The assigned user is unavailable.')
  }

  const id = crypto.randomUUID()
  const statements: D1PreparedStatement[] = [
    env.DB.prepare('INSERT INTO leads (id, lead_type, business_name, contact_name, email, phone, website, business_state, industry, source, assigned_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(
      id, input.lead_type, input.business_name, input.contact_name, input.email, input.phone ?? null,
      input.website ?? null, input.business_state ?? null, input.industry ?? null, input.source ?? null,
      input.assigned_user_id ?? null,
    ),
  ]

  if (input.details) {
    const details = input.details
    statements.push(env.DB.prepare('INSERT INTO lead_details (id, lead_id, estimated_monthly_processing_volume_cents, current_processor, years_in_business, estimated_monthly_revenue_cents, funding_amount_requested_cents, additional_information) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      crypto.randomUUID(), id, details.estimated_monthly_processing_volume_cents ?? null,
      details.current_processor ?? null, details.years_in_business ?? null,
      details.estimated_monthly_revenue_cents ?? null, details.funding_amount_requested_cents ?? null,
      details.additional_information ?? null,
    ))
  }

  statements.push(
    activityStatement(env.DB, { leadId: id, userId: user.id, type: 'created', description: 'Lead created.' }),
    auditStatement(env.DB, { actorUserId: user.id, action: 'lead.created', entityType: 'lead', entityId: id, metadata: { lead_type: input.lead_type } }),
  )
  await env.DB.batch(statements)
  return json({ data: { id } }, 201)
}

async function getLead(context: ApiContext, leadId: string): Promise<Response> {
  const parsedId = idSchema.safeParse(leadId)
  if (!parsedId.success) return notFound()
  const { env, user } = context
  const scope = user.role === 'administrator' ? '' : ' AND l.assigned_user_id = ?'
  const parameters = user.role === 'administrator' ? [leadId] : [leadId, user.id]
  const lead = await env.DB.prepare(`SELECT l.*, u.display_name AS assigned_user_name, d.estimated_monthly_processing_volume_cents, d.current_processor, d.years_in_business, d.estimated_monthly_revenue_cents, d.funding_amount_requested_cents, d.additional_information FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id LEFT JOIN lead_details d ON d.lead_id = l.id WHERE l.id = ?${scope} LIMIT 1`).bind(...parameters).first<LeadRow & Record<string, unknown>>()
  if (!lead) return notFound()

  const [notes, activities, followUps] = await Promise.all([
    env.DB.prepare('SELECT n.id, n.user_id, u.display_name AS user_name, n.note, n.created_at, n.updated_at FROM lead_notes n JOIN users u ON u.id = n.user_id WHERE n.lead_id = ? ORDER BY n.created_at DESC LIMIT 100').bind(leadId).all(),
    env.DB.prepare('SELECT a.id, a.user_id, u.display_name AS user_name, a.activity_type, a.description, a.created_at FROM lead_activities a JOIN users u ON u.id = a.user_id WHERE a.lead_id = ? ORDER BY a.created_at DESC LIMIT 100').bind(leadId).all(),
    env.DB.prepare(`SELECT f.id, f.assigned_user_id, u.display_name AS assigned_user_name, f.title, f.due_at, f.completed_at, f.status, f.created_at, f.updated_at FROM follow_ups f JOIN users u ON u.id = f.assigned_user_id WHERE f.lead_id = ?${user.role === 'administrator' ? '' : ' AND f.assigned_user_id = ?'} ORDER BY f.due_at LIMIT 100`).bind(...(user.role === 'administrator' ? [leadId] : [leadId, user.id])).all(),
  ])

  return json({ data: { ...lead, notes: notes.results, activities: activities.results, follow_ups: followUps.results } })
}

async function updateLead(context: ApiContext, leadId: string): Promise<Response> {
  const { request, env, user } = context
  if (!idSchema.safeParse(leadId).success) return notFound()
  const parsed = await readJson(request, leadPatchSchema)
  if (!parsed.success) return badRequest('Lead changes are invalid.')
  const input = parsed.data
  if (user.role === 'sales_representative' && Object.hasOwn(input, 'assigned_user_id')) return forbidden()

  const current = await env.DB.prepare('SELECT id, status, assigned_user_id FROM leads WHERE id = ? AND (? = "administrator" OR assigned_user_id = ?) LIMIT 1').bind(leadId, user.role, user.id).first<{ id: string; status: string; assigned_user_id: string | null }>()
  if (!current) return notFound()
  if (input.assigned_user_id) {
    const assignee = await env.DB.prepare('SELECT id FROM users WHERE id = ? AND active = 1').bind(input.assigned_user_id).first()
    if (!assignee) return badRequest('The assigned user is unavailable.')
  }

  const columns: Record<string, SqlValue> = {}
  for (const key of ['business_name', 'contact_name', 'email', 'phone', 'website', 'business_state', 'industry', 'source', 'status', 'assigned_user_id'] as const) {
    if (Object.hasOwn(input, key)) columns[key] = input[key] ?? null
  }
  const keys = Object.keys(columns)
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(`UPDATE leads SET ${keys.map((key) => `${key} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(...Object.values(columns), leadId),
  ]

  if (input.status && input.status !== current.status) {
    statements.push(activityStatement(env.DB, { leadId, userId: user.id, type: 'status_changed', description: `Status changed to ${input.status}.` }))
  }
  if (Object.hasOwn(input, 'assigned_user_id') && input.assigned_user_id !== current.assigned_user_id) {
    statements.push(activityStatement(env.DB, { leadId, userId: user.id, type: 'assigned', description: input.assigned_user_id ? 'Lead assignment changed.' : 'Lead assignment cleared.' }))
  }
  if (!input.status && !Object.hasOwn(input, 'assigned_user_id')) {
    statements.push(activityStatement(env.DB, { leadId, userId: user.id, type: 'updated', description: 'Lead information updated.' }))
  }
  statements.push(auditStatement(env.DB, {
    actorUserId: user.id,
    action: Object.hasOwn(input, 'assigned_user_id') ? 'lead.updated_or_assigned' : 'lead.updated',
    entityType: 'lead',
    entityId: leadId,
    metadata: { fields: keys, ...(input.status ? { status: input.status } : {}) },
  }))

  await env.DB.batch(statements)
  return json({ data: { id: leadId, updated: true } })
}

async function listNotes(context: ApiContext, leadId: string): Promise<Response> {
  const lead = await context.env.DB.prepare('SELECT id, assigned_user_id FROM leads WHERE id = ?').bind(leadId).first<{ id: string; assigned_user_id: string | null }>()
  if (!lead || !canAccessAssignedRecord(context.user, lead.assigned_user_id)) return notFound()
  const notes = await context.env.DB.prepare('SELECT n.id, n.user_id, u.display_name AS user_name, n.note, n.created_at, n.updated_at FROM lead_notes n JOIN users u ON u.id = n.user_id WHERE n.lead_id = ? ORDER BY n.created_at DESC LIMIT 100').bind(leadId).all()
  return json({ data: notes.results })
}

async function createNote(context: ApiContext, leadId: string): Promise<Response> {
  if (!idSchema.safeParse(leadId).success) return notFound()
  const parsed = await readJson(context.request, noteSchema)
  if (!parsed.success) return badRequest('Note is invalid.')
  const lead = await context.env.DB.prepare('SELECT id, assigned_user_id FROM leads WHERE id = ?').bind(leadId).first<{ id: string; assigned_user_id: string | null }>()
  if (!lead || !canAccessAssignedRecord(context.user, lead.assigned_user_id)) return notFound()
  const noteId = crypto.randomUUID()
  await context.env.DB.batch([
    context.env.DB.prepare('INSERT INTO lead_notes (id, lead_id, user_id, note) VALUES (?, ?, ?, ?)').bind(noteId, leadId, context.user.id, parsed.data.note),
    activityStatement(context.env.DB, { leadId, userId: context.user.id, type: 'note_added', description: 'A note was added.' }),
    auditStatement(context.env.DB, { actorUserId: context.user.id, action: 'note.created', entityType: 'note', entityId: noteId, metadata: { lead_id: leadId } }),
  ])
  return json({ data: { id: noteId } }, 201)
}

async function exportLeads(context: ApiContext): Promise<Response> {
  if (!hasRole(context.user, 'administrator')) return forbidden()
  const limit = Math.min(10_000, Math.max(1, Number(context.url.searchParams.get('limit') ?? 10_000) || 10_000))
  const query = context.env.DB.prepare('SELECT l.business_name, l.contact_name, l.email, l.phone, l.lead_type, l.status, l.source, l.created_at, l.updated_at, u.display_name AS assigned_user FROM leads l LEFT JOIN users u ON u.id = l.assigned_user_id ORDER BY l.created_at DESC LIMIT ?').bind(limit)
  const [result] = await context.env.DB.batch([
    query,
    auditStatement(context.env.DB, { actorUserId: context.user.id, action: 'lead.exported', entityType: 'export', entityId: crypto.randomUUID(), metadata: { max_rows: limit } }),
  ])
  const rows = (result.results ?? []) as Array<Record<string, unknown>>
  const columns = ['business_name', 'contact_name', 'email', 'phone', 'lead_type', 'status', 'source', 'created_at', 'updated_at', 'assigned_user']
  const csvCell = (value: unknown) => {
    const text = String(value ?? '')
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
    return `"${safeText.replaceAll('"', '""')}"`
  }
  const body = [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gohero-leads.csv"',
      'Cache-Control': 'no-store',
    },
  })
}

export async function handleAdminLeads(context: ApiContext, path: string[]): Promise<Response> {
  if (path.length === 1 && path[0] === 'export' && context.request.method === 'GET') return exportLeads(context)
  if (path.length === 0) {
    if (context.request.method === 'GET') return listLeads(context)
    if (context.request.method === 'POST') return createLead(context)
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.')
  }

  const [leadId, resource] = path
  if (path.length === 2 && resource === 'notes') {
    if (context.request.method === 'GET') return listNotes(context, leadId)
    if (context.request.method === 'POST') return createNote(context, leadId)
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.')
  }
  if (path.length === 1 && leadId) {
    if (context.request.method === 'GET') return getLead(context, leadId)
    if (context.request.method === 'PATCH') return updateLead(context, leadId)
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.')
  }
  return notFound()
}