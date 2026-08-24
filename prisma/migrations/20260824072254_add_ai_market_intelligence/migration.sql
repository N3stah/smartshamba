/*
  Warnings:

  - You are about to drop the `WeatherAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeatherCache` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `recommendation` on the `MarketPrediction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AIRecommendation" AS ENUM ('SELL', 'WAIT', 'BUY', 'HOLD');

-- CreateEnum
CREATE TYPE "AIUserType" AS ENUM ('FARMER', 'BUYER', 'ADMIN', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "AIInsightType" AS ENUM ('PRICE_PREDICTION', 'DEMAND_FORECAST', 'MARKET_ALERT');

-- DropIndex
DROP INDEX "MarketPrediction_crop_region_idx";

-- AlterTable
ALTER TABLE "MarketPrediction" ALTER COLUMN "region" DROP DEFAULT,
DROP COLUMN "recommendation",
ADD COLUMN     "recommendation" "AIRecommendation" NOT NULL,
ALTER COLUMN "explanation" DROP NOT NULL;

-- DropTable
DROP TABLE "WeatherAlert";

-- DropTable
DROP TABLE "WeatherCache";

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "AIUserType" NOT NULL,
    "type" "AIInsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_farmerId_fkey" FOREIGN KEY ("userId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_buyerId_fkey" FOREIGN KEY ("userId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
