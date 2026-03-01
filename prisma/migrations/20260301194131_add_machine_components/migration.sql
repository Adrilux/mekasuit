-- CreateTable
CREATE TABLE "machine_components" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "stockItemId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "machine_components_tenantId_machineId_idx" ON "machine_components"("tenantId", "machineId");

-- CreateIndex
CREATE INDEX "machine_components_parentId_idx" ON "machine_components"("parentId");

-- AddForeignKey
ALTER TABLE "machine_components" ADD CONSTRAINT "machine_components_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_components" ADD CONSTRAINT "machine_components_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "machine_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_components" ADD CONSTRAINT "machine_components_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
