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

-- 10. Table audit_logs — Immuabilité RLS (Append-Only : SELECT/INSERT autorisés, UPDATE/DELETE interdits au niveau SGBD)
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_select_policy ON "audit_logs";
DROP POLICY IF EXISTS audit_logs_insert_policy ON "audit_logs";
DROP POLICY IF EXISTS audit_logs_update_deny  ON "audit_logs";
DROP POLICY IF EXISTS audit_logs_delete_deny  ON "audit_logs";

CREATE POLICY audit_logs_select_policy ON "audit_logs" FOR SELECT
  USING (
    get_current_tenant_id() IS NOT NULL AND
    ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')
  );

CREATE POLICY audit_logs_insert_policy ON "audit_logs" FOR INSERT
  WITH CHECK (get_current_tenant_id() IS NOT NULL);

CREATE POLICY audit_logs_update_deny ON "audit_logs" FOR UPDATE
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY audit_logs_delete_deny ON "audit_logs" FOR DELETE
  USING (FALSE);

-- NEW POLICIES (Taches 1 & 2)

-- 11. Table depots
ALTER TABLE "depots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "depots" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_depots ON "depots";
DROP POLICY IF EXISTS depots_select_policy ON "depots";
DROP POLICY IF EXISTS depots_insert_policy ON "depots";
DROP POLICY IF EXISTS depots_update_policy ON "depots";
DROP POLICY IF EXISTS depots_delete_policy ON "depots";

CREATE POLICY depots_select_policy ON "depots" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY depots_insert_policy ON "depots" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY depots_update_policy ON "depots" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY depots_delete_policy ON "depots" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 12. Table clients
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_clients ON "clients";
DROP POLICY IF EXISTS clients_select_policy ON "clients";
DROP POLICY IF EXISTS clients_insert_policy ON "clients";
DROP POLICY IF EXISTS clients_update_policy ON "clients";
DROP POLICY IF EXISTS clients_delete_policy ON "clients";

CREATE POLICY clients_select_policy ON "clients" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY clients_insert_policy ON "clients" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY clients_update_policy ON "clients" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY clients_delete_policy ON "clients" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 13. Table suppliers
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_suppliers ON "suppliers";
DROP POLICY IF EXISTS suppliers_select_policy ON "suppliers";
DROP POLICY IF EXISTS suppliers_insert_policy ON "suppliers";
DROP POLICY IF EXISTS suppliers_update_policy ON "suppliers";
DROP POLICY IF EXISTS suppliers_delete_policy ON "suppliers";

CREATE POLICY suppliers_select_policy ON "suppliers" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY suppliers_insert_policy ON "suppliers" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY suppliers_update_policy ON "suppliers" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY suppliers_delete_policy ON "suppliers" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 14. Table it_service_packages
ALTER TABLE "it_service_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "it_service_packages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_it_service_packages ON "it_service_packages";
DROP POLICY IF EXISTS it_service_packages_select_policy ON "it_service_packages";
DROP POLICY IF EXISTS it_service_packages_insert_policy ON "it_service_packages";
DROP POLICY IF EXISTS it_service_packages_update_policy ON "it_service_packages";
DROP POLICY IF EXISTS it_service_packages_delete_policy ON "it_service_packages";

CREATE POLICY it_service_packages_select_policy ON "it_service_packages" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY it_service_packages_insert_policy ON "it_service_packages" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY it_service_packages_update_policy ON "it_service_packages" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY it_service_packages_delete_policy ON "it_service_packages" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 15. Table payment_installments
ALTER TABLE "payment_installments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_installments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_payment_installments ON "payment_installments";
DROP POLICY IF EXISTS payment_installments_select_policy ON "payment_installments";
DROP POLICY IF EXISTS payment_installments_insert_policy ON "payment_installments";
DROP POLICY IF EXISTS payment_installments_update_policy ON "payment_installments";
DROP POLICY IF EXISTS payment_installments_delete_policy ON "payment_installments";

CREATE POLICY payment_installments_select_policy ON "payment_installments" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY payment_installments_insert_policy ON "payment_installments" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY payment_installments_update_policy ON "payment_installments" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY payment_installments_delete_policy ON "payment_installments" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 16. Table billing_sequences
ALTER TABLE "billing_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_sequences" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_billing_sequences ON "billing_sequences";
DROP POLICY IF EXISTS billing_sequences_select_policy ON "billing_sequences";
DROP POLICY IF EXISTS billing_sequences_insert_policy ON "billing_sequences";
DROP POLICY IF EXISTS billing_sequences_update_policy ON "billing_sequences";
DROP POLICY IF EXISTS billing_sequences_delete_policy ON "billing_sequences";

CREATE POLICY billing_sequences_select_policy ON "billing_sequences" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY billing_sequences_insert_policy ON "billing_sequences" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY billing_sequences_update_policy ON "billing_sequences" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY billing_sequences_delete_policy ON "billing_sequences" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 17. Table tailleur_catalog_items
ALTER TABLE "tailleur_catalog_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tailleur_catalog_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tailleur_catalog_items ON "tailleur_catalog_items";
DROP POLICY IF EXISTS tailleur_catalog_items_select_policy ON "tailleur_catalog_items";
DROP POLICY IF EXISTS tailleur_catalog_items_insert_policy ON "tailleur_catalog_items";
DROP POLICY IF EXISTS tailleur_catalog_items_update_policy ON "tailleur_catalog_items";
DROP POLICY IF EXISTS tailleur_catalog_items_delete_policy ON "tailleur_catalog_items";

CREATE POLICY tailleur_catalog_items_select_policy ON "tailleur_catalog_items" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY tailleur_catalog_items_insert_policy ON "tailleur_catalog_items" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY tailleur_catalog_items_update_policy ON "tailleur_catalog_items" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY tailleur_catalog_items_delete_policy ON "tailleur_catalog_items" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 18. Table purchase_orders
ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_purchase_orders ON "purchase_orders";
DROP POLICY IF EXISTS purchase_orders_select_policy ON "purchase_orders";
DROP POLICY IF EXISTS purchase_orders_insert_policy ON "purchase_orders";
DROP POLICY IF EXISTS purchase_orders_update_policy ON "purchase_orders";
DROP POLICY IF EXISTS purchase_orders_delete_policy ON "purchase_orders";

CREATE POLICY purchase_orders_select_policy ON "purchase_orders" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY purchase_orders_insert_policy ON "purchase_orders" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY purchase_orders_update_policy ON "purchase_orders" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY purchase_orders_delete_policy ON "purchase_orders" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 19. Table inventory_sessions
ALTER TABLE "inventory_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_inventory_sessions ON "inventory_sessions";
DROP POLICY IF EXISTS inventory_sessions_select_policy ON "inventory_sessions";
DROP POLICY IF EXISTS inventory_sessions_insert_policy ON "inventory_sessions";
DROP POLICY IF EXISTS inventory_sessions_update_policy ON "inventory_sessions";
DROP POLICY IF EXISTS inventory_sessions_delete_policy ON "inventory_sessions";

CREATE POLICY inventory_sessions_select_policy ON "inventory_sessions" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY inventory_sessions_insert_policy ON "inventory_sessions" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY inventory_sessions_update_policy ON "inventory_sessions" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY inventory_sessions_delete_policy ON "inventory_sessions" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND ("tenantId" = get_current_tenant_id() OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 20. Table notifications (Nullable tenantId)
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_notifications ON "notifications";
DROP POLICY IF EXISTS notifications_select_policy ON "notifications";
DROP POLICY IF EXISTS notifications_insert_policy ON "notifications";
DROP POLICY IF EXISTS notifications_update_policy ON "notifications";
DROP POLICY IF EXISTS notifications_delete_policy ON "notifications";

CREATE POLICY notifications_select_policy ON "notifications" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY notifications_insert_policy ON "notifications" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY notifications_update_policy ON "notifications" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY notifications_delete_policy ON "notifications" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 21. Table saas_quotes (Nullable tenantId)
ALTER TABLE "saas_quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saas_quotes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_saas_quotes ON "saas_quotes";
DROP POLICY IF EXISTS saas_quotes_select_policy ON "saas_quotes";
DROP POLICY IF EXISTS saas_quotes_insert_policy ON "saas_quotes";
DROP POLICY IF EXISTS saas_quotes_update_policy ON "saas_quotes";
DROP POLICY IF EXISTS saas_quotes_delete_policy ON "saas_quotes";

CREATE POLICY saas_quotes_select_policy ON "saas_quotes" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY saas_quotes_insert_policy ON "saas_quotes" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY saas_quotes_update_policy ON "saas_quotes" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY saas_quotes_delete_policy ON "saas_quotes" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));

-- 22. Table platform_analytics (Nullable tenantId)
ALTER TABLE "platform_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_analytics" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_platform_analytics ON "platform_analytics";
DROP POLICY IF EXISTS platform_analytics_select_policy ON "platform_analytics";
DROP POLICY IF EXISTS platform_analytics_insert_policy ON "platform_analytics";
DROP POLICY IF EXISTS platform_analytics_update_policy ON "platform_analytics";
DROP POLICY IF EXISTS platform_analytics_delete_policy ON "platform_analytics";

CREATE POLICY platform_analytics_select_policy ON "platform_analytics" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY platform_analytics_insert_policy ON "platform_analytics" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY platform_analytics_update_policy ON "platform_analytics" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY platform_analytics_delete_policy ON "platform_analytics" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));


-- 23. Table roles (Nullable tenantId)
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS roles_select_policy ON "roles";
DROP POLICY IF EXISTS roles_insert_policy ON "roles";
DROP POLICY IF EXISTS roles_update_policy ON "roles";
DROP POLICY IF EXISTS roles_delete_policy ON "roles";

CREATE POLICY roles_select_policy ON "roles" FOR SELECT USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY roles_insert_policy ON "roles" FOR INSERT WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY roles_update_policy ON "roles" FOR UPDATE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__')) WITH CHECK (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
CREATE POLICY roles_delete_policy ON "roles" FOR DELETE USING (get_current_tenant_id() IS NOT NULL AND (("tenantId" = get_current_tenant_id()) OR ("tenantId" IS NULL AND get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__') OR get_current_tenant_id() = '__SYSTEM_GLOBAL_SUPERADMIN__'));
