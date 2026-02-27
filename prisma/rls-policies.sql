-- =============================================================================
-- Politiques Row Level Security (RLS) — GMAO SaaS
-- À exécuter UNE FOIS après la première migration Prisma
-- Le contexte tenant est défini via : SELECT set_config('app.current_tenant_id', 'xxx', true)
-- Note : Prisma crée les colonnes en camelCase ("tenantId" avec guillemets)
-- =============================================================================

-- Activer RLS sur toutes les tables tenant-scoped
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_parts_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Les tables globales (tenants, licenses, tenant_modules) ne sont pas isolées par RLS
-- car elles sont gérées par le super_admin uniquement via withTenantContext()

-- =============================================================================
-- Politiques d'isolation par tenant
-- Pattern identique pour toutes les tables
-- Les noms de colonnes sont entre guillemets car Prisma les génère en camelCase
-- =============================================================================

-- Sites
CREATE POLICY tenant_isolation_sites ON sites
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Utilisateurs tenant
CREATE POLICY tenant_isolation_tenant_users ON tenant_users
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Assignations utilisateur-site
CREATE POLICY tenant_isolation_user_sites ON user_sites
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Machines
CREATE POLICY tenant_isolation_machines ON machines
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Interventions
CREATE POLICY tenant_isolation_interventions ON interventions
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Notes d'interventions
CREATE POLICY tenant_isolation_intervention_notes ON intervention_notes
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Stock items
CREATE POLICY tenant_isolation_stock_items ON stock_items
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Mouvements de stock
CREATE POLICY tenant_isolation_stock_movements ON stock_movements
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Pièces utilisées en intervention
CREATE POLICY tenant_isolation_intervention_parts ON intervention_parts_used
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Demandes de transfert
CREATE POLICY tenant_isolation_stock_transfers ON stock_transfer_requests
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_notifications ON notifications
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Planned materials
ALTER TABLE intervention_planned_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_planned_materials ON intervention_planned_materials
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Tenant roles
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tenant_roles ON tenant_roles
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- =============================================================================
-- Note : le rôle DB de l'application doit avoir FORCE ROW LEVEL SECURITY
-- pour que les politiques s'appliquent même aux superusers applicatifs
-- Le super_admin SaaS bypass via une transaction dédiée avec set_config
-- =============================================================================
