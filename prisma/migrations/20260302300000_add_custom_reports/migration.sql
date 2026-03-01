-- CreateTable
CREATE TABLE "custom_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "columns" TEXT[],
    "filters" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_reports_tenantId_idx" ON "custom_reports"("tenantId");

-- RLS
ALTER TABLE "custom_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "custom_reports"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
