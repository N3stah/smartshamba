-- CreateEnum
CREATE TYPE "NegotiationActor" AS ENUM ('SELLER', 'BUYER');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'FULFILLED', 'DISPUTED', 'CANCELLED', 'EXECUTED', 'VOIDED');

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationOffer" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "actor" "NegotiationActor" NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "terms" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "templateId" TEXT,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "terms" JSONB,
    "paymentTerms" TEXT,
    "transportTerms" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "verificationId" TEXT NOT NULL,
    "farmerSigned" BOOLEAN NOT NULL DEFAULT false,
    "buyerSigned" BOOLEAN NOT NULL DEFAULT false,
    "farmerSignedAt" TIMESTAMP(3),
    "buyerSignedAt" TIMESTAMP(3),
    "farmerSignature" TEXT,
    "buyerSignature" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_transactionId_key" ON "Contract"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_verificationId_key" ON "Contract"("verificationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_walletId_idx" ON "LedgerEntry"("walletId");

-- CreateIndex
CREATE INDEX "LedgerEntry_relatedTransactionId_idx" ON "LedgerEntry"("relatedTransactionId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_walletId_idx" ON "WithdrawalRequest"("walletId");

-- AddForeignKey
ALTER TABLE "NegotiationOffer" ADD CONSTRAINT "NegotiationOffer_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
