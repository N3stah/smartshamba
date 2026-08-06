import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

/**
 * Posts a double-entry to the immutable ledger.
 */
export async function postLedgerEntry(params: {
  userId: string;
  userType: string; // "FARMER", "BUYER", "TRANSPORT", "PLATFORM", "ESCROW"
  transactionId?: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  description: string;
  reference?: string;
}) {
  try {
    const entry = await prisma.ledgerEntry.create({
      data: {
        userId: params.userId,
        userType: params.userType,
        transactionId: params.transactionId ?? null,
        entryType: params.entryType,
        amount: Math.abs(params.amount),
        description: params.description,
        reference: params.reference ?? null,
      }
    });
    return entry;
  } catch (error) {
    console.error('[LEDGER] Failed to post entry:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error;
  }
}

/**
 * Calculates the current wallet balance for a user.
 * Balance = Sum(CREDITS) - Sum(DEBITS)
 */
export async function getWalletBalance(userId: string, userType: string): Promise<number> {
  const entries = await prisma.ledgerEntry.findMany({
    where: { userId, userType },
    select: { entryType: true, amount: true }
  });

  const balance = entries.reduce((sum, entry) => {
    return entry.entryType === 'CREDIT' ? sum + entry.amount : sum - entry.amount;
  }, 0);

  return Math.round(balance * 100) / 100;
}

/**
 * Processes the financial settlement for a standard Transaction.
 * Debits Escrow, Credits Farmer (98%), Credits Platform Revenue (2%).
 */
export async function processTransactionSettlement(transactionId: string, totalValue: number, farmerId: string) {
  const PLATFORM_FEE_RATE = 0.02;
  const platformFee = Math.round((totalValue * PLATFORM_FEE_RATE) * 100) / 100;
  const farmerPayout = Math.round((totalValue - platformFee) * 100) / 100;

  // 1. Debit Escrow Wallet
  await postLedgerEntry({
    userId: 'escrow',
    userType: 'ESCROW',
    transactionId,
    entryType: 'DEBIT',
    amount: totalValue,
    description: `Escrow release for Transaction ${transactionId.substring(0, 8)}`,
    reference: `RELEASE-${transactionId.substring(0, 8)}`
  });

  // 2. Credit Farmer's wallet
  await postLedgerEntry({
    userId: farmerId,
    userType: 'FARMER',
    transactionId,
    entryType: 'CREDIT',
    amount: farmerPayout,
    description: `Sale proceeds for Transaction ${transactionId.substring(0, 8)}`,
    reference: `SETTLE-${transactionId.substring(0, 8)}`
  });

  // 3. Credit Platform Revenue wallet
  if (platformFee > 0) {
    await postLedgerEntry({
      userId: 'revenue',
      userType: 'PLATFORM',
      transactionId,
      entryType: 'CREDIT',
      amount: platformFee,
      description: `Platform fee (2%) for Transaction ${transactionId.substring(0, 8)}`,
      reference: `FEE-${transactionId.substring(0, 8)}`
    });
  }
}

/**
 * Processes the financial settlement for a Group Transaction.
 * Calculates proportional payouts for each member based on pledged bags.
 */
export async function processGroupSettlement(groupTxId: string, totalValue: number, groupMembers: any[], transportCost: number = 0) {
  const PLATFORM_FEE_RATE = 0.02;
  const totalBags = groupMembers.reduce((sum, m) => sum + m.bagsPledged, 0);
  
  // Net value after transport cost
  const netValue = totalValue - transportCost;
  
  for (const member of groupMembers) {
    if (member.bagsPledged === 0) continue;
    
    const shareRatio = member.bagsPledged / totalBags;
    const grossShare = Math.round((netValue * shareRatio) * 100) / 100;
    const platformFee = Math.round((grossShare * PLATFORM_FEE_RATE) * 100) / 100;
    const farmerPayout = Math.round((grossShare - platformFee) * 100) / 100;
    
    // Credit Farmer
    await postLedgerEntry({
      userId: member.farmerId,
      userType: 'FARMER',
      transactionId: groupTxId,
      entryType: 'CREDIT',
      amount: farmerPayout,
      description: `Group sale proceeds (${member.bagsPledged} bags) for Tx ${groupTxId.substring(0, 8)}`,
      reference: `GRP-SETTLE-${groupTxId.substring(0, 8)}`
    });
    
    // Credit Platform Revenue
    if (platformFee > 0) {
      await postLedgerEntry({
        userId: 'revenue',
        userType: 'PLATFORM',
        transactionId: groupTxId,
        entryType: 'CREDIT',
        amount: platformFee,
        description: `Platform fee (2%) for Group Tx ${groupTxId.substring(0, 8)}`,
        reference: `GRP-FEE-${groupTxId.substring(0, 8)}`
      });
    }
  }
  
  // Debit Escrow for the full amount
  await postLedgerEntry({
    userId: 'escrow',
    userType: 'ESCROW',
    transactionId: groupTxId,
    entryType: 'DEBIT',
    amount: totalValue,
    description: `Escrow release for Group Transaction ${groupTxId.substring(0, 8)}`,
    reference: `GRP-RELEASE-${groupTxId.substring(0, 8)}`
  });
}
