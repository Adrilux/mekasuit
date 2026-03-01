-- Add cancellation fields to stock_movements
ALTER TABLE "stock_movements" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "stock_movements" ADD COLUMN "cancelledBy" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN "cancelReason" TEXT;
