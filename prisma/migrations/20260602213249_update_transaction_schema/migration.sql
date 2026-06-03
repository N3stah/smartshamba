/*
  Warnings:

  - You are about to drop the column `amountBags` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Transaction` table. All the data in the column will be lost.
  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[reference]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pricePerBag` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantityBags` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalValue` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'SETTLED', 'DISPUTED');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amountBags",
DROP COLUMN "totalPrice",
DROP COLUMN "updatedAt",
ADD COLUMN     "mpesaRef" TEXT,
ADD COLUMN     "pricePerBag" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "quantityBags" INTEGER NOT NULL,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "totalValue" DOUBLE PRECISION NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TxStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "TransactionStatus";

-- CreateTable
CREATE TABLE "UssdSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "state" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UssdSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UssdSession_sessionId_key" ON "UssdSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");
