-- CreateTable: one row per hero carousel slide
CREATE TABLE "public"."HeroSlideBackground" (
    "slideKey" TEXT NOT NULL,
    "backgroundType" TEXT NOT NULL DEFAULT 'default',
    "backgroundImage" TEXT,
    "backgroundColor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlideBackground_pkey" PRIMARY KEY ("slideKey")
);

-- Preserve any background an admin already configured for slide 1 under the
-- old single-row HeroBanner table, carrying it over as "slide1" here.
INSERT INTO "public"."HeroSlideBackground" ("slideKey", "backgroundType", "backgroundImage", "backgroundColor", "updatedAt")
SELECT 'slide1', "backgroundType", "backgroundImage", "backgroundColor", "updatedAt"
FROM "public"."HeroBanner"
WHERE "id" = 1;

-- The old singleton table is fully superseded by HeroSlideBackground above.
DROP TABLE "public"."HeroBanner";

-- CreateTable: promo/announcement banner (singleton, same shape as the old HeroBanner)
CREATE TABLE "public"."PromoBanner" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "backgroundType" TEXT NOT NULL DEFAULT 'default',
    "backgroundImage" TEXT,
    "backgroundColor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoBanner_pkey" PRIMARY KEY ("id")
);

-- Seed the default row so the endpoint works immediately without an extra admin step
INSERT INTO "public"."PromoBanner" ("id", "backgroundType", "updatedAt")
VALUES (1, 'default', CURRENT_TIMESTAMP);
