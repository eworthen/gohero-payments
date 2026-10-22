INSERT OR IGNORE INTO users (id, access_identity_id, email, display_name, role, active)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'dev-access-admin', 'admin@local.invalid', 'Local Administrator', 'administrator', 1),
  ('00000000-0000-4000-8000-000000000002', 'dev-access-sales', 'sales@local.invalid', 'Local Sales Representative', 'sales_representative', 1);