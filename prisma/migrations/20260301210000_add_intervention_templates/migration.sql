-- CreateTable
CREATE TABLE "intervention_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "InterventionType" NOT NULL DEFAULT 'PREVENTIVE',
    "priority" "InterventionPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervention_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_template_checklist_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "intervention_template_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intervention_templates_tenantId_idx" ON "intervention_templates"("tenantId");

-- CreateIndex
CREATE INDEX "intervention_template_checklist_items_tenantId_templateId_idx" ON "intervention_template_checklist_items"("tenantId", "templateId");

-- AddForeignKey
ALTER TABLE "intervention_template_checklist_items" ADD CONSTRAINT "intervention_template_checklist_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "intervention_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "intervention_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "intervention_template_checklist_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "intervention_templates"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

CREATE POLICY "tenant_isolation" ON "intervention_template_checklist_items"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
