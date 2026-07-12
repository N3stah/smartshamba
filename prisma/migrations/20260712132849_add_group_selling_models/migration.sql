-- CreateTable
CREATE TABLE "FarmerGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "countyId" TEXT,
    "wardId" TEXT,
    "village" TEXT,
    "createdById" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "bagsPledged" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTransaction" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "totalBags" INTEGER NOT NULL,
    "pricePerBag" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarmerGroup_countyId_idx" ON "FarmerGroup"("countyId");

-- CreateIndex
CREATE INDEX "FarmerGroup_wardId_idx" ON "FarmerGroup"("wardId");

-- CreateIndex
CREATE INDEX "FarmerGroup_active_idx" ON "FarmerGroup"("active");

-- CreateIndex
CREATE INDEX "GroupMember_farmerId_idx" ON "GroupMember"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_farmerId_key" ON "GroupMember"("groupId", "farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupTransaction_reference_key" ON "GroupTransaction"("reference");

-- CreateIndex
CREATE INDEX "GroupTransaction_groupId_idx" ON "GroupTransaction"("groupId");

-- CreateIndex
CREATE INDEX "GroupTransaction_buyerId_idx" ON "GroupTransaction"("buyerId");

-- AddForeignKey
ALTER TABLE "FarmerGroup" ADD CONSTRAINT "FarmerGroup_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerGroup" ADD CONSTRAINT "FarmerGroup_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerGroup" ADD CONSTRAINT "FarmerGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FarmerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTransaction" ADD CONSTRAINT "GroupTransaction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FarmerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTransaction" ADD CONSTRAINT "GroupTransaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
