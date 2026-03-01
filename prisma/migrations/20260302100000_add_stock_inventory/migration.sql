-- CreateEnum
CREATE TYPE "StockInventoryStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable stock_inventory_sessions
CREATE TABLE "stock_inventory_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "status" "StockInventoryStatus" NOT NULL DEFAULT 'OPEN',
    "createdBy" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_inventory_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_inventory_sessions_tenantId_siteId_idx" ON "stock_inventory_sessions"("tenantId", "siteId");

-- AddForeignKey
ALTER TABLE "stock_inventory_sessions" ADD CONSTRAINT "stock_inventory_sessions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable stock_inventory_items
CREATE TABLE "stock_inventory_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER,
    "note" TEXT,

    CONSTRAINT "stock_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_inventory_items_sessionId_stockItemId_key" ON "stock_inventory_items"("sessionId", "stockItemId");

-- CreateIndex
CREATE INDEX "stock_inventory_items_tenantId_sessionId_idx" ON "stock_inventory_items"("tenantId", "sessionId");

-- AddForeignKey
ALTER TABLE "stock_inventory_items" ADD CONSTRAINT "stock_inventory_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "stock_inventory_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_inventory_items" ADD CONSTRAINT "stock_inventory_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "stock_inventory_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_inventory_items" ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY tenant_isolation_stock_inventory_sessions ON "stock_inventory_sessions"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_stock_inventory_items ON "stock_inventory_items"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
