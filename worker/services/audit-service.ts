type SqlValue = string | number | null | boolean | ArrayBuffer | ArrayBufferView

export interface AuditInput {
  actorUserId: string
  action: string
  entityType: 'lead' | 'note' | 'follow_up' | 'user' | 'export'
  entityId: string
  metadata?: Record<string, string | number | boolean | string[] | null>
}

export function auditStatement(db: D1Database, input: AuditInput): D1PreparedStatement {
  const metadata = JSON.stringify(input.metadata ?? {})
  if (metadata.length > 4096) throw new Error('Audit metadata exceeds the permitted size.')
  return db.prepare(
    'INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(crypto.randomUUID(), input.actorUserId, input.action, input.entityType, input.entityId, metadata) as D1PreparedStatement & { __sqlValue?: SqlValue }
}

export function activityStatement(
  db: D1Database,
  input: { leadId: string; userId: string; type: string; description: string },
): D1PreparedStatement {
  return db.prepare(
    'INSERT INTO lead_activities (id, lead_id, user_id, activity_type, description) VALUES (?, ?, ?, ?, ?)',
  ).bind(crypto.randomUUID(), input.leadId, input.userId, input.type, input.description)
}