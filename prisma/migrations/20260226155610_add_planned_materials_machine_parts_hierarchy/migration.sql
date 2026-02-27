-- AlterTable
ALTER TABLE "stock_items" ADD COLUMN     "machineId" TEXT;

-- AlterTable
ALTER TABLE "tenant_users" ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "managerId" TEXT;

-- CreateTable
CREATE TABLE "intervention_planned_materials" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "quantityPlanned" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_planned_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intervention_planned_materials_tenantId_idx" ON "intervention_planned_materials"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "intervention_planned_materials_interventionId_stockItemId_key" ON "intervention_planned_materials"("interventionId", "stockItemId");

-- AddForeignKey
ALTER TABLE "intervention_planned_materials" ADD CONSTRAINT "intervention_planned_materials_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_planned_materials" ADD CONSTRAINT "intervention_planned_materials_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
