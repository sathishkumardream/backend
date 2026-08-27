-- CreateTable
CREATE TABLE "public"."CategoryImage" (
    "key" TEXT NOT NULL,
    "imageUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryImage_pkey" PRIMARY KEY ("key")
);

-- No seed rows needed: a missing key is treated by the API as "no image set",
-- so all four categories (men/women/boys/girls) work fine with an empty table.
