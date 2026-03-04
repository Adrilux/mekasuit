-- AddColumn: systemRole on tenant_roles
ALTER TABLE "tenant_roles" ADD COLUMN "systemRole" "UserRole";

-- AddUniqueConstraint: one system role type per tenant
CREATE UNIQUE INDEX "tenant_roles_tenantId_systemRole_key" ON "tenant_roles"("tenantId", "systemRole");
