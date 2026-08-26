-- CreateTable
CREATE TABLE "public"."HeroBanner" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "backgroundType" TEXT NOT NULL DEFAULT 'default',
    "backgroundImage" TEXT,
    "backgroundColor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);

-- Seed the default row so the endpoint works immediately without an extra admin step
INSERT INTO "public"."HeroBanner" ("id", "backgroundType", "updatedAt")
VALUES (1, 'default', CURRENT_TIMESTAMP);
