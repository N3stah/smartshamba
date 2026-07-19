-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTION_CONFIRMATION', 'SETTLEMENT', 'WEEKLY_MARKET_REPORT', 'HARVEST_ADVISORY', 'QUALITY_ADVISORY', 'DISPUTE_UPDATE', 'OTP', 'GROUP_TRANSACTION');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "farmerId" TEXT,
    "buyerId" TEXT,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "providerResponse" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "transactionSms" BOOLEAN NOT NULL DEFAULT true,
    "weeklyMarketReport" BOOLEAN NOT NULL DEFAULT true,
    "harvestTips" BOOLEAN NOT NULL DEFAULT true,
    "qualityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "disputeUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advisory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "countyId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advisory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityAssessment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "moistureAnswer" TEXT,
    "grainColour" TEXT,
    "brokenGrain" TEXT,
    "foreignMatter" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_farmerId_idx" ON "Notification"("farmerId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_farmerId_key" ON "NotificationPreference"("farmerId");

-- CreateIndex
CREATE INDEX "Advisory_active_idx" ON "Advisory"("active");

-- CreateIndex
CREATE INDEX "Advisory_countyId_idx" ON "Advisory"("countyId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityAssessment_transactionId_key" ON "QualityAssessment"("transactionId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advisory" ADD CONSTRAINT "Advisory_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAssessment" ADD CONSTRAINT "QualityAssessment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
