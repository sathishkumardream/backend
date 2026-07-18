-- AlterTable
ALTER TABLE "public"."Product"
  ADD COLUMN "originalPrice" DOUBLE PRECISION,
  ADD COLUMN "sizes" TEXT,
  ADD COLUMN "colors" TEXT;
