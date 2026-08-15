import { prisma } from '@/lib/prisma';

export async function buildSecureAIContext(userId: string, userRole: 'FARMER' | 'BUYER' | 'ADMIN') {
  try {
    if (userRole === 'FARMER') {
      const [listings, activeTransactions] = await Promise.all([
        prisma.produceListing.findMany({ where: { farmerId: userId }, take: 5 }),
        prisma.transaction.findMany({
          where: { farmerId: userId, status: { in: ['PENDING', 'CONFIRMED', 'DELIVERED'] } },
          take: 3,
        }),
      ]);
      return { role: 'FARMER', listings, activeTransactions };
    }

    if (userRole === 'BUYER') {
      const [demands, activeTransactions] = await Promise.all([
        prisma.buyerDemand.findMany({ where: { buyerId: userId }, take: 5 }).catch(() => []),
        prisma.transaction.findMany({
          where: { buyerId: userId, status: { in: ['PENDING', 'CONFIRMED', 'DELIVERED'] } },
          take: 3,
        }),
      ]);
      return { role: 'BUYER', demands, activeTransactions };
    }

    if (userRole === 'ADMIN') {
      const [totalFarmers, totalBuyers, pendingTransactions] = await Promise.all([
        prisma.farmer.count(),
        prisma.buyer.count(),
        prisma.transaction.count({ where: { status: 'PENDING' } }),
      ]);
      return { role: 'ADMIN', totalFarmers, totalBuyers, pendingTransactions };
    }

    return { role: userRole };
  } catch (error) {
    console.error('[AI] Context builder error:', (error as Error).message);
    return { role: userRole };
  }
}
