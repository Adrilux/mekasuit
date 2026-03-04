-- AddColumn: imageUrl on stock_items
ALTER TABLE "stock_items" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- AddColumn: productUrls on stock_item_suppliers
ALTER TABLE "stock_item_suppliers" ADD COLUMN IF NOT EXISTS "productUrls" TEXT[] NOT NULL DEFAULT '{}';
