-- AlterEnum
ALTER TYPE "TxStatus" ADD VALUE 'SETTLING';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "b2cRef" TEXT,
ADD COLUMN     "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "B2CPayout" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "conversationId" TEXT,
    "originatorConversationID" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mpesaRef" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2CPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "B2CPayout_transactionId_key" ON "B2CPayout"("transactionId");

-- AddForeignKey
ALTER TABLE "B2CPayout" ADD CONSTRAINT "B2CPayout_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
