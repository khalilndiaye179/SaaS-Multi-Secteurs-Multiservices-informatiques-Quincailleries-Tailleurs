-- Migration SQL Idempotente pour RLS PostgreSQL avec USING et WITH CHECK
-- Force RLS sur l'ensemble des 9 tables tenant-scoped

-- Function Helper pour vérifier la variable de session (Strictement Fail-Closed)
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS text AS $$
DECLARE
  v_tenant text;
BEGIN
  v_tenant := current_setting('app.current_tenant_id', true);
  IF v_tenant IS NULL OR v_tenant = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_tenant;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Table users
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_users ON "users";
CREATE POLICY tenant_isolation_users ON "users"
  FOR ALL
  USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'))
  WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 2. Table stock_items
ALTER TABLE "stock_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_stock ON "stock_items";
DROP POLICY IF EXISTS stock_items_select_policy ON "stock_items";
DROP POLICY IF EXISTS stock_items_insert_policy ON "stock_items";
DROP POLICY IF EXISTS stock_items_update_policy ON "stock_items";
DROP POLICY IF EXISTS stock_items_delete_policy ON "stock_items";

CREATE POLICY stock_items_select_policy ON "stock_items" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY stock_items_insert_policy ON "stock_items" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY stock_items_update_policy ON "stock_items" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY stock_items_delete_policy ON "stock_items" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 3. Table repair_tickets
ALTER TABLE "repair_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "repair_tickets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tickets ON "repair_tickets";
DROP POLICY IF EXISTS repair_tickets_select_policy ON "repair_tickets";
DROP POLICY IF EXISTS repair_tickets_insert_policy ON "repair_tickets";
DROP POLICY IF EXISTS repair_tickets_update_policy ON "repair_tickets";
DROP POLICY IF EXISTS repair_tickets_delete_policy ON "repair_tickets";

CREATE POLICY repair_tickets_select_policy ON "repair_tickets" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY repair_tickets_insert_policy ON "repair_tickets" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY repair_tickets_update_policy ON "repair_tickets" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY repair_tickets_delete_policy ON "repair_tickets" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 4. Table client_measurements
ALTER TABLE "client_measurements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_measurements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_measurements ON "client_measurements";
DROP POLICY IF EXISTS client_measurements_select_policy ON "client_measurements";
DROP POLICY IF EXISTS client_measurements_insert_policy ON "client_measurements";
DROP POLICY IF EXISTS client_measurements_update_policy ON "client_measurements";
DROP POLICY IF EXISTS client_measurements_delete_policy ON "client_measurements";

CREATE POLICY client_measurements_select_policy ON "client_measurements" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY client_measurements_insert_policy ON "client_measurements" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY client_measurements_update_policy ON "client_measurements" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY client_measurements_delete_policy ON "client_measurements" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 5. Table payment_proofs
ALTER TABLE "payment_proofs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_proofs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_payment_proofs ON "payment_proofs";
DROP POLICY IF EXISTS payment_proofs_select_policy ON "payment_proofs";
DROP POLICY IF EXISTS payment_proofs_insert_policy ON "payment_proofs";
DROP POLICY IF EXISTS payment_proofs_update_policy ON "payment_proofs";
DROP POLICY IF EXISTS payment_proofs_delete_policy ON "payment_proofs";

CREATE POLICY payment_proofs_select_policy ON "payment_proofs" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY payment_proofs_insert_policy ON "payment_proofs" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY payment_proofs_update_policy ON "payment_proofs" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY payment_proofs_delete_policy ON "payment_proofs" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 6. Table quotes
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_quotes ON "quotes";
DROP POLICY IF EXISTS quotes_select_policy ON "quotes";
DROP POLICY IF EXISTS quotes_insert_policy ON "quotes";
DROP POLICY IF EXISTS quotes_update_policy ON "quotes";
DROP POLICY IF EXISTS quotes_delete_policy ON "quotes";

CREATE POLICY quotes_select_policy ON "quotes" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY quotes_insert_policy ON "quotes" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY quotes_update_policy ON "quotes" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY quotes_delete_policy ON "quotes" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 7. Table invoices
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoices ON "invoices";
DROP POLICY IF EXISTS invoices_select_policy ON "invoices";
DROP POLICY IF EXISTS invoices_insert_policy ON "invoices";
DROP POLICY IF EXISTS invoices_update_policy ON "invoices";
DROP POLICY IF EXISTS invoices_delete_policy ON "invoices";

CREATE POLICY invoices_select_policy ON "invoices" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY invoices_insert_policy ON "invoices" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY invoices_update_policy ON "invoices" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY invoices_delete_policy ON "invoices" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 8. Table stock_movements
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_stock_movements ON "stock_movements";
DROP POLICY IF EXISTS stock_movements_select_policy ON "stock_movements";
DROP POLICY IF EXISTS stock_movements_insert_policy ON "stock_movements";
DROP POLICY IF EXISTS stock_movements_update_policy ON "stock_movements";
DROP POLICY IF EXISTS stock_movements_delete_policy ON "stock_movements";

CREATE POLICY stock_movements_select_policy ON "stock_movements" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY stock_movements_insert_policy ON "stock_movements" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY stock_movements_update_policy ON "stock_movements" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY stock_movements_delete_policy ON "stock_movements" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 9. Table tailleur_orders
ALTER TABLE "tailleur_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tailleur_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tailleur_orders ON "tailleur_orders";
DROP POLICY IF EXISTS tailleur_orders_select_policy ON "tailleur_orders";
DROP POLICY IF EXISTS tailleur_orders_insert_policy ON "tailleur_orders";
DROP POLICY IF EXISTS tailleur_orders_update_policy ON "tailleur_orders";
DROP POLICY IF EXISTS tailleur_orders_delete_policy ON "tailleur_orders";

CREATE POLICY tailleur_orders_select_policy ON "tailleur_orders" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY tailleur_orders_insert_policy ON "tailleur_orders" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY tailleur_orders_update_policy ON "tailleur_orders" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY tailleur_orders_delete_policy ON "tailleur_orders" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
