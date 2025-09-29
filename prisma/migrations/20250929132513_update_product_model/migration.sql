-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "chip" TEXT,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "gyroscope" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "microphoneQuality" INTEGER,
ADD COLUMN     "priceInUA" DOUBLE PRECISION,
ADD COLUMN     "sellsCount" INTEGER,
ADD COLUMN     "sensesOfEar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "wirelessCharger" BOOLEAN NOT NULL DEFAULT false;
