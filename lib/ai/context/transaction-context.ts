import { prisma } from '@/lib/prisma';

export interface TransactionContext {
  pendingTransactions: { reference: string; quantityBags: number; totalValue: number }[];
}

export async function getFarmerTransactionContext(farmerId: string): Promise<TransactionContext> {
  const pendingTx = await prisma.transaction.findMany({
    where: { farmerId, status: { in: ['PENDING', 'CONFIRMED'] } },
    take: 3,
    select: { reference: true, quantityBags: true, totalValue: true }
  });
  return { pendingTransactions: pendingTx };
}

export async function getBuyerTransactionContext(buyerId: string): Promise<TransactionContext> {
  const pendingTx = await prisma.transaction.findMany({
    where: { buyerId, status: { in: ['PENDING', 'CONFIRMED'] } },
    take: 3,
    select: { reference: true, quantityBags: true, totalValue: true }
  });
  return { pendingTransactions: pendingTx };
}
