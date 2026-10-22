PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  access_identity_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
  role TEXT NOT NULL CHECK (role IN ('administrator', 'sales_representative')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE leads (
  id TEXT PRIMARY KEY NOT NULL,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('merchant_processing', 'business_funding')),
  business_name TEXT NOT NULL CHECK (length(business_name) BETWEEN 1 AND 160),
  contact_name TEXT NOT NULL CHECK (length(contact_name) BETWEEN 1 AND 160),
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT CHECK (phone IS NULL OR length(phone) <= 40),
  website TEXT CHECK (website IS NULL OR length(website) <= 200),
  business_state TEXT CHECK (business_state IS NULL OR length(business_state) <= 80),
  industry TEXT CHECK (industry IS NULL OR length(industry) <= 120),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'converted', 'lost')),
  source TEXT CHECK (source IS NULL OR length(source) <= 100),
  assigned_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE lead_details (
  id TEXT PRIMARY KEY NOT NULL,
  lead_id TEXT NOT NULL UNIQUE REFERENCES leads(id) ON DELETE RESTRICT,
  estimated_monthly_processing_volume_cents INTEGER CHECK (estimated_monthly_processing_volume_cents IS NULL OR estimated_monthly_processing_volume_cents >= 0),
  current_processor TEXT CHECK (current_processor IS NULL OR length(current_processor) <= 120),
  years_in_business REAL CHECK (years_in_business IS NULL OR years_in_business >= 0),
  estimated_monthly_revenue_cents INTEGER CHECK (estimated_monthly_revenue_cents IS NULL OR estimated_monthly_revenue_cents >= 0),
  funding_amount_requested_cents INTEGER CHECK (funding_amount_requested_cents IS NULL OR funding_amount_requested_cents >= 0),
  additional_information TEXT CHECK (additional_information IS NULL OR length(additional_information) <= 4000)
);

CREATE TABLE lead_notes (
  id TEXT PRIMARY KEY NOT NULL,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note TEXT NOT NULL CHECK (length(note) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE lead_activities (
  id TEXT PRIMARY KEY NOT NULL,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'updated', 'assigned', 'status_changed', 'note_added', 'follow_up_created', 'follow_up_updated')),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 300),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE follow_ups (
  id TEXT PRIMARY KEY NOT NULL,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  assigned_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 180),
  due_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (length(action) BETWEEN 1 AND 80),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'note', 'follow_up', 'user', 'export')),
  entity_id TEXT NOT NULL CHECK (length(entity_id) BETWEEN 1 AND 80),
  metadata TEXT NOT NULL DEFAULT '{}' CHECK (length(metadata) <= 4096 AND json_valid(metadata)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX users_role_active_idx ON users(role, active);
CREATE INDEX leads_assignee_created_idx ON leads(assigned_user_id, created_at DESC);
CREATE INDEX leads_status_updated_idx ON leads(status, updated_at DESC);
CREATE INDEX leads_type_created_idx ON leads(lead_type, created_at DESC);
CREATE INDEX leads_email_idx ON leads(email);
CREATE INDEX leads_business_name_idx ON leads(business_name COLLATE NOCASE);
CREATE INDEX leads_contact_name_idx ON leads(contact_name COLLATE NOCASE);
CREATE INDEX notes_lead_created_idx ON lead_notes(lead_id, created_at DESC);
CREATE INDEX activities_lead_created_idx ON lead_activities(lead_id, created_at DESC);
CREATE INDEX follow_ups_assignee_due_idx ON follow_ups(assigned_user_id, status, due_at);
CREATE INDEX follow_ups_lead_due_idx ON follow_ups(lead_id, due_at);
CREATE INDEX audit_created_idx ON audit_logs(created_at DESC);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE TRIGGER keep_active_administrator
BEFORE UPDATE OF role, active ON users
WHEN OLD.role = 'administrator'
  AND OLD.active = 1
  AND (NEW.role != 'administrator' OR NEW.active = 0)
  AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE role = 'administrator' AND active = 1 AND id != OLD.id
  )
BEGIN
  SELECT RAISE(ABORT, 'at least one active administrator is required');
END;