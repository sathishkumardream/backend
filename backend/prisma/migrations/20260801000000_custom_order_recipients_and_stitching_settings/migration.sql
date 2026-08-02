-- CreateTable
CREATE TABLE "public"."StitchingSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "sizePricing" JSONB NOT NULL,
    "ownFabricFee" DOUBLE PRECISION NOT NULL DEFAULT 799,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StitchingSettings_pkey" PRIMARY KEY ("id")
);

-- Seed a sensible default row so the app works immediately without an extra admin step
INSERT INTO "public"."StitchingSettings" ("id", "sizePricing", "ownFabricFee", "updatedAt")
VALUES (1, '{"S": 499, "M": 599, "L": 699, "XL": 799, "XXL": 899}'::jsonb, 799, CURRENT_TIMESTAMP);

-- AlterTable: CustomDesign no longer needs per-size pricing (moved to StitchingSettings, applied uniformly)
ALTER TABLE "public"."CustomDesign" DROP COLUMN IF EXISTS "sizePricing";

-- AlterTable: CustomOrder — drop the old single-size fields, add multi-recipient + tailoring detail fields
ALTER TABLE "public"."CustomOrder" DROP COLUMN IF EXISTS "fabricChoice";
ALTER TABLE "public"."CustomOrder" DROP COLUMN IF EXISTS "sizeMode";
ALTER TABLE "public"."CustomOrder" DROP COLUMN IF EXISTS "standardSize";
ALTER TABLE "public"."CustomOrder" DROP COLUMN IF EXISTS "measurements";

ALTER TABLE "public"."CustomOrder"
  ADD COLUMN "recipients" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "blouseType" TEXT,
  ADD COLUMN "neckPattern" TEXT,
  ADD COLUMN "backDesign" TEXT,
  ADD COLUMN "referenceImage" TEXT,
  ADD COLUMN "fabricCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "stitchingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Drop the defaults now that existing rows are backfilled — new rows must supply real values
ALTER TABLE "public"."CustomOrder" ALTER COLUMN "recipients" DROP DEFAULT;
ALTER TABLE "public"."CustomOrder" ALTER COLUMN "fabricCost" DROP DEFAULT;
ALTER TABLE "public"."CustomOrder" ALTER COLUMN "stitchingCost" DROP DEFAULT;
