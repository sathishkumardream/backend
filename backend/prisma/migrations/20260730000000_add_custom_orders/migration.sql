-- CreateTable
CREATE TABLE "public"."CustomDesign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "comboType" TEXT NOT NULL,
    "tag" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "sizePricing" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomOrder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "designId" INTEGER,
    "sourceProductId" INTEGER,
    "comboType" TEXT NOT NULL,
    "fabricType" TEXT NOT NULL,
    "fabricChoice" TEXT,
    "sizeMode" TEXT NOT NULL,
    "standardSize" TEXT,
    "measurements" JSONB,
    "notes" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CustomOrder" ADD CONSTRAINT "CustomOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomOrder" ADD CONSTRAINT "CustomOrder_designId_fkey" FOREIGN KEY ("designId") REFERENCES "public"."CustomDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomOrder" ADD CONSTRAINT "CustomOrder_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
