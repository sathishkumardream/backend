-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN "image" TEXT;
