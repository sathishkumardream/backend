-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN "subcategory" TEXT;

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "price" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key" ON "public"."ProductVariant"("productId", "size", "color");

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: CartItem gains an optional variant link.
-- The old (cartId, productId) uniqueness is dropped here because it no longer reflects
-- real uniqueness once variants exist — two rows can legitimately share the same
-- cartId+productId while differing only by variantId (e.g. same t-shirt, different size).
-- Uniqueness is now enforced in application code (cartController) instead of the database.
DROP INDEX IF EXISTS "public"."CartItem_cartId_productId_key";
ALTER TABLE "public"."CartItem" ADD COLUMN "variantId" INTEGER;
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN "variantId" INTEGER;
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
