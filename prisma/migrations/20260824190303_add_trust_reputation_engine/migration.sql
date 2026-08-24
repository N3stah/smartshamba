-- CreateEnum
CREATE TYPE "TrustUserType" AS ENUM ('FARMER', 'BUYER', 'TRANSPORT', 'GROUP');

-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "frozenReason" TEXT,
ADD COLUMN     "isFrozen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Farmer" ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "frozenReason" TEXT,
ADD COLUMN     "isFrozen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "TrustUserType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "breakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextComputeAt" TIMESTAMP(3),

    CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "TrustUserType" NOT NULL,
    "eventType" TEXT NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustScore_userId_userType_key" ON "TrustScore"("userId", "userType");
