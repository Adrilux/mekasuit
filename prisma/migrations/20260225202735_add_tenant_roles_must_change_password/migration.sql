-- AlterTable
ALTER TABLE "tenant_users" ADD COLUMN     "tenantRoleId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "tenant_roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_roles_tenantId_idx" ON "tenant_roles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_roles_tenantId_name_key" ON "tenant_roles"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "tenant_roles" ADD CONSTRAINT "tenant_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "tenant_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
