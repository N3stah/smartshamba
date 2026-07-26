-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "Farmer" ADD COLUMN     "password" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FarmerGroup" ADD COLUMN     "whatsappLink" TEXT;

-- CreateTable
CREATE TABLE "ProduceListing" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "quantityBags" INTEGER NOT NULL,
    "pricePerBag" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProduceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerDemand" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "quantityBags" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerDemand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProduceListing_farmerId_idx" ON "ProduceListing"("farmerId");

-- CreateIndex
CREATE INDEX "BuyerDemand_buyerId_idx" ON "BuyerDemand"("buyerId");

-- AddForeignKey
ALTER TABLE "ProduceListing" ADD CONSTRAINT "ProduceListing_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerDemand" ADD CONSTRAINT "BuyerDemand_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
