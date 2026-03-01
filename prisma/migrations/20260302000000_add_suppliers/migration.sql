-- CreateTable suppliers
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_tenantId_idx" ON "suppliers"("tenantId");

-- CreateTable stock_item_suppliers
CREATE TABLE "stock_item_suppliers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierReference" TEXT,
    "purchasePriceCents" INTEGER NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER,

    CONSTRAINT "stock_item_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_item_suppliers_stockItemId_supplierId_key" ON "stock_item_suppliers"("stockItemId", "supplierId");

-- CreateIndex
CREATE INDEX "stock_item_suppliers_tenantId_stockItemId_idx" ON "stock_item_suppliers"("tenantId", "stockItemId");

-- AddForeignKey
ALTER TABLE "stock_item_suppliers" ADD CONSTRAINT "stock_item_suppliers_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_item_suppliers" ADD CONSTRAINT "stock_item_suppliers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_item_suppliers" ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY tenant_isolation_suppliers ON "suppliers"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_stock_item_suppliers ON "stock_item_suppliers"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
