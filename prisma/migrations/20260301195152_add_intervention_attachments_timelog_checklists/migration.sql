-- CreateTable
CREATE TABLE "intervention_attachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_time_entries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervention_time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_checklists" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_checklist_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3),
    "checkedBy" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "intervention_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intervention_attachments_tenantId_interventionId_idx" ON "intervention_attachments"("tenantId", "interventionId");

-- CreateIndex
CREATE INDEX "intervention_time_entries_tenantId_interventionId_idx" ON "intervention_time_entries"("tenantId", "interventionId");

-- CreateIndex
CREATE INDEX "checklist_templates_tenantId_idx" ON "checklist_templates"("tenantId");

-- CreateIndex
CREATE INDEX "checklist_template_items_tenantId_templateId_idx" ON "checklist_template_items"("tenantId", "templateId");

-- CreateIndex
CREATE INDEX "intervention_checklists_tenantId_interventionId_idx" ON "intervention_checklists"("tenantId", "interventionId");

-- CreateIndex
CREATE INDEX "intervention_checklist_items_tenantId_checklistId_idx" ON "intervention_checklist_items"("tenantId", "checklistId");

-- AddForeignKey
ALTER TABLE "intervention_attachments" ADD CONSTRAINT "intervention_attachments_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_time_entries" ADD CONSTRAINT "intervention_time_entries_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_checklists" ADD CONSTRAINT "intervention_checklists_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_checklist_items" ADD CONSTRAINT "intervention_checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "intervention_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
