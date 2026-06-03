// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing buyers to avoid duplicates if re-running the seed script
  await prisma.buyer.deleteMany({});

  const buyers = [
    {
      name: "Kitale Millers",
      location: "Kitale Town",
      verified: true,
      capacityBags: 5000,
      pricePerBag: 2800.00,
      active: true,
    },
    {
      name: "Eldoret Grain",
      location: "Eldoret CBD",
      verified: true,
      capacityBags: 8500,
      pricePerBag: 2950.00,
      active: true,
    },
    {
      name: "Trans Nzoia Cereals",
      location: "Mois Bridge",
      verified: false,
      capacityBags: 3000,
      pricePerBag: 2700.00,
      active: true,
    },
  ];

  for (const buyer of buyers) {
    const createdBuyer = await prisma.buyer.create({
      data: buyer,
    });
    console.log(`✅ Created buyer: ${createdBuyer.name} at ${createdBuyer.location}`);
  }

  console.log("🏁 Seeding complete! Database is populated.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });