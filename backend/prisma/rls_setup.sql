-- Migration SQL Initial pour PostgreSQL RLS (Row Level Security)

-- Activation RLS sur les tables sensibles
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Suppression préalable des anciennes policies
DROP POLICY IF EXISTS tenant_isolation_stock_items ON stock_items;
DROP POLICY IF EXISTS tenant_isolation_repair_tickets ON repair_tickets;
DROP POLICY IF EXISTS tenant_isolation_client_measurements ON client_measurements;
DROP POLICY IF EXISTS tenant_isolation_users ON users;

-- Policies RLS basées sur la variable de session Postgres 'app.current_tenant_id'
CREATE POLICY tenant_isolation_stock_items ON stock_items
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_repair_tickets ON repair_tickets
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_client_measurements ON client_measurements
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));
