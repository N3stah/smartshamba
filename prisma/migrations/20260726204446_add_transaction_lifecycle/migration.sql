-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TxStatus" ADD VALUE 'AGREED';
ALTER TYPE "TxStatus" ADD VALUE 'DELIVERY_SCHEDULED';
ALTER TYPE "TxStatus" ADD VALUE 'CLOSED';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "deliveryLocation" TEXT,
ADD COLUMN     "deliveryMethod" TEXT,
ADD COLUMN     "fulfillmentNotes" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3);
