import { getWalletBalance } from '@/lib/finance/ledger-service';
import { prisma } from '@/lib/prisma';

export interface FinanceContext {
  historicalRevenue?: number;
  platformBalance?: number;
  escrowBalance?: number;
  pendingWithdrawals?: number;
}

export async function getCFOFinanceContext(snapshotRevenue: number): Promise<FinanceContext> {
  const [platformBalance, escrowBalance, pendingWithdrawals] = await Promise.all([
    getWalletBalance('PLATFORM', 'PLATFORM'),
    getWalletBalance('ESCROW', 'ESCROW'),
    prisma.withdrawalRequest.count({ where: { status: 'PENDING' } })
  ]);
  return { historicalRevenue: snapshotRevenue, platformBalance, escrowBalance, pendingWithdrawals };
}
