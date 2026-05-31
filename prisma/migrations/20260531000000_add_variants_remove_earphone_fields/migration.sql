-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priceCNY" DOUBLE PRECISION NOT NULL,
    "priceInUA" DOUBLE PRECISION,
    "netPrice" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "pddSearchQuery" TEXT,
    "sellsCount" INTEGER,
    "purchasedCount" INTEGER DEFAULT 0,
    "shippingUA" DOUBLE PRECISION,
    "managementUAH" DOUBLE PRECISION,
    "rateCNY" DOUBLE PRECISION,
    "rateUSD" DOUBLE PRECISION,
    "shippingType" TEXT,
    "customShippingRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- Ensure missing columns exist on Product table before migrating data (for shadow database validation)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "netPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rateCNY" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rateUSD" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shippingType" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "customShippingRate" DOUBLE PRECISION;

-- Migrate existing product data into Variant rows
INSERT INTO "Variant" ("id", "productId", "priceCNY", "priceInUA", "netPrice", "weight", "pddSearchQuery", "sellsCount", "purchasedCount", "shippingUA", "managementUAH", "rateCNY", "rateUSD", "shippingType", "customShippingRate", "createdAt")
SELECT
    gen_random_uuid(),
    "id",
    COALESCE("priceUAH", 0),
    "priceInUA",
    "netPrice",
    "weight",
    "olxUrl",
    "sellsCount",
    "purchasedCount",
    "shippingUA",
    "managementUAH",
    "rateCNY",
    "rateUSD",
    "shippingType",
    "customShippingRate",
    "createdAt"
FROM "Product";

-- Drop moved columns from Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "priceUAH";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "priceInUA";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "netPrice";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "weight";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "olxUrl";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "sellsCount";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "purchasedCount";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "shippingUA";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "managementUAH";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "rateCNY";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "rateUSD";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "shippingType";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "customShippingRate";

-- Drop earphone-specific columns from Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "workModalWindowIOS";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "soundReducer";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "sensesOfEar";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "wirelessCharger";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "gyroscope";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "microphoneQuality";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "chip";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "equipment";

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Variant_productId_idx" ON "Variant"("productId");
