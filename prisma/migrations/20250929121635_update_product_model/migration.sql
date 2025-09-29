/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - Added the required column `priceUAH` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "imageUrl",
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "olxUrl" TEXT,
ADD COLUMN     "pinduoduoUrl" TEXT,
ADD COLUMN     "priceUAH" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "soundReducer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workModalWindowIOS" BOOLEAN NOT NULL DEFAULT false;
