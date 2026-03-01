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

-- Machine attachments
ALTER TABLE machine_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_machine_attachments ON machine_attachments
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Machine counters
ALTER TABLE machine_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_machine_counters ON machine_counters
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Machine counter readings
ALTER TABLE machine_counter_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_machine_counter_readings ON machine_counter_readings
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Machine components (BOM)
ALTER TABLE machine_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_machine_components ON machine_components
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Intervention attachments
ALTER TABLE intervention_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_intervention_attachments ON intervention_attachments
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Intervention time entries
ALTER TABLE intervention_time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_intervention_time_entries ON intervention_time_entries
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Checklist templates
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_checklist_templates ON checklist_templates
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Checklist template items
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_checklist_template_items ON checklist_template_items
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Intervention checklists
ALTER TABLE intervention_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_intervention_checklists ON intervention_checklists
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Intervention checklist items
ALTER TABLE intervention_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_intervention_checklist_items ON intervention_checklist_items
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- =============================================================================
-- Note : le rôle DB de l'application doit avoir FORCE ROW LEVEL SECURITY
-- pour que les politiques s'appliquent même aux superusers applicatifs
-- Le super_admin SaaS bypass via une transaction dédiée avec set_config
-- =============================================================================
