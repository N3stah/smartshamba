-- DropIndex
DROP INDEX "Dispute_status_idx";

-- DropIndex
DROP INDEX "Notification_status_idx";

-- CreateIndex
CREATE INDEX "Dispute_transactionId_idx" ON "Dispute"("transactionId");

-- CreateIndex
CREATE INDEX "Notification_recipientPhone_idx" ON "Notification"("recipientPhone");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_buyerId_idx" ON "Transaction"("buyerId");

-- CreateIndex
CREATE INDEX "Transaction_farmerId_idx" ON "Transaction"("farmerId");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");
