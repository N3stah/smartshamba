/*
  Warnings:

  - You are about to drop the column `buyerId` on the `PushSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `farmerId` on the `PushSubscription` table. All the data in the column will be lost.
  - Added the required column `userId` to the `PushSubscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_farmerId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "PushSubscription" DROP COLUMN "buyerId",
DROP COLUMN "farmerId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MarketPrediction" (
    "id" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'National',
    "horizon" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "predictedPrice" DOUBLE PRECISION NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "recommendation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketPrediction_crop_region_idx" ON "MarketPrediction"("crop", "region");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrediction_crop_region_horizon_key" ON "MarketPrediction"("crop", "region", "horizon");
