import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

/**
 * Gets or creates a wallet for a user or system account.
 */
export async function getOrCreateWalletId(userId: string | null, userType: string): Promise<string> {
  try {
    if (userType === 'FARMER' && userId) {
      const wallet = await prisma.wallet.upsert({
        where: { farmerId: userId },
        update: {},
        create: { farmerId: userId, type: 'USER' },
      });
      return wallet.id;
    } else if (userType === 'BUYER' && userId) {
      const wallet = await prisma.wallet.upsert({
        where: { buyerId: userId },
        update: {},
        create: { buyerId: userId, type: 'USER' },
      });
      return wallet.id;
    } else if (userType === 'ESCROW') {
      let wallet = await prisma.wallet.findFirst({ where: { type: 'ESCROW' } });
      if (!wallet) wallet = await prisma.wallet.create({ data: { type: 'ESCROW' } });
      return wallet.id;
    } else if (userType === 'PLATFORM') {
      let wallet = await prisma.wallet.findFirst({ where: { type: 'PLATFORM' } });
      if (!wallet) wallet = await prisma.wallet.create({ data: { type: 'PLATFORM' } });
      return wallet.id;
    }
    throw new Error('Invalid user type for wallet');
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

/**
 * Posts a double-entry to the immutable ledger and updates the wallet balance in a single transaction.
 */
export async function postLedgerEntry(params: {
  walletId: string;
  transactionId?: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  reference?: string;
}) {
  try {
    const entry = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: params.walletId } });
      const amount = Math.abs(params.amount);
      const balanceAfter = params.type === 'CREDIT' ? wallet.balance + amount : wallet.balance - amount;
      
      if (balanceAfter < 0) throw new Error('Insufficient balance for debit');
      
      const newEntry = await tx.ledgerEntry.create({
        data: {
          walletId: params.walletId,
          type: params.type,
          amount: amount,
          description: params.description,
          reference: params.reference ?? null,
          balanceAfter: balanceAfter,
          relatedTransactionId: params.transactionId ?? null,
        }
      });
      
      await tx.wallet.update({
        where: { id: params.walletId },
        data: { balance: balanceAfter }
      });
      
      return newEntry;
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
 * Gets the current wallet balance for a user.
 */
export async function getWalletBalance(userId: string, userType: string): Promise<number> {
  const walletId = await getOrCreateWalletId(userId, userType);
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  return wallet ? Math.round(wallet.balance * 100) / 100 : 0;
}

/**
 * Processes the financial settlement for a standard Transaction.
 * Debits Escrow, Credits Farmer (98%), Credits Platform Revenue (2%).
 */
export async function processTransactionSettlement(transactionId: string, totalValue: number, farmerId: string) {
  const PLATFORM_FEE_RATE = 0.02;
  const platformFee = Math.round((totalValue * PLATFORM_FEE_RATE) * 100) / 100;
  const farmerPayout = Math.round((totalValue - platformFee) * 100) / 100;

  const escrowWalletId = await getOrCreateWalletId(null, 'ESCROW');
  const farmerWalletId = await getOrCreateWalletId(farmerId, 'FARMER');
  const platformWalletId = await getOrCreateWalletId(null, 'PLATFORM');

  // 1. Debit Escrow Wallet
  await postLedgerEntry({
    walletId: escrowWalletId,
    transactionId,
    type: 'DEBIT',
    amount: totalValue,
    description: `Escrow release for Transaction ${transactionId.substring(0, 8)}`,
    reference: `RELEASE-${transactionId.substring(0, 8)}`
  });

  // 2. Credit Farmer's wallet
  await postLedgerEntry({
    walletId: farmerWalletId,
    transactionId,
    type: 'CREDIT',
    amount: farmerPayout,
    description: `Sale proceeds for Transaction ${transactionId.substring(0, 8)}`,
    reference: `SETTLE-${transactionId.substring(0, 8)}`
  });

  // 3. Credit Platform Revenue wallet
  if (platformFee > 0) {
    await postLedgerEntry({
      walletId: platformWalletId,
      transactionId,
      type: 'CREDIT',
      amount: platformFee,
      description: `Platform fee (2%) for Transaction ${transactionId.substring(0, 8)}`,
      reference: `FEE-${transactionId.substring(0, 8)}`
    });
  }
}

/**
 * Processes the financial settlement for a Group Transaction.
 */
export async function processGroupSettlement(groupTxId: string, totalValue: number, groupMembers: any[], transportCost: number = 0) {
  const PLATFORM_FEE_RATE = 0.02;
  const totalBags = groupMembers.reduce((sum, m) => sum + m.bagsPledged, 0);
  const netValue = totalValue - transportCost;
  
  const escrowWalletId = await getOrCreateWalletId(null, 'ESCROW');
  const platformWalletId = await getOrCreateWalletId(null, 'PLATFORM');
  
  for (const member of groupMembers) {
    if (member.bagsPledged === 0) continue;
    
    const shareRatio = member.bagsPledged / totalBags;
    const grossShare = Math.round((netValue * shareRatio) * 100) / 100;
    const platformFee = Math.round((grossShare * PLATFORM_FEE_RATE) * 100) / 100;
    const farmerPayout = Math.round((grossShare - platformFee) * 100) / 100;
    
    const farmerWalletId = await getOrCreateWalletId(member.farmerId, 'FARMER');
    
    await postLedgerEntry({
      walletId: farmerWalletId,
      transactionId: groupTxId,
      type: 'CREDIT',
      amount: farmerPayout,
      description: `Group sale proceeds (${member.bagsPledged} bags) for Tx ${groupTxId.substring(0, 8)}`,
      reference: `GRP-SETTLE-${groupTxId.substring(0, 8)}`
    });
    
    if (platformFee > 0) {
      await postLedgerEntry({
        walletId: platformWalletId,
        transactionId: groupTxId,
        type: 'CREDIT',
        amount: platformFee,
        description: `Platform fee (2%) for Group Tx ${groupTxId.substring(0, 8)}`,
        reference: `GRP-FEE-${groupTxId.substring(0, 8)}`
      });
    }
  }
  
  await postLedgerEntry({
    walletId: escrowWalletId,
    transactionId: groupTxId,
    type: 'DEBIT',
    amount: totalValue,
    description: `Escrow release for Group Transaction ${groupTxId.substring(0, 8)}`,
    reference: `GRP-RELEASE-${groupTxId.substring(0, 8)}`
  });
}
