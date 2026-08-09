-- AlterTable
ALTER TABLE "public"."CustomOrder"
  ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
  ADD COLUMN "shippingName" TEXT,
  ADD COLUMN "shippingPhone" TEXT,
  ADD COLUMN "shippingLine1" TEXT,
  ADD COLUMN "shippingLine2" TEXT,
  ADD COLUMN "shippingCity" TEXT,
  ADD COLUMN "shippingState" TEXT,
  ADD COLUMN "shippingPincode" TEXT;
