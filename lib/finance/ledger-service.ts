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
 * Processes the financial settlement for a Transport Booking.
 * Must be atomic and idempotent.
 */
export async function processTransportSettlement(bookingId: string): Promise<{ success: boolean; message: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Atomically claim the settlement
      const booking = await tx.transportBooking.update({
        where: { id: bookingId, financialSettled: false },
        data: { financialSettled: true },
        include: { transaction: true }
      }).catch(() => null);

      if (!booking) {
        const existing = await tx.transportBooking.findUnique({ where: { id: bookingId } });
        if (existing && existing.financialSettled) {
          return { success: true, message: 'Already settled' };
        }
        throw new Error('Booking not found or state invalid');
      }

      // 2. Verify booking is COMPLETED
      if (booking.status !== 'COMPLETED') {
        throw new Error('Booking is not COMPLETED');
      }

      // 3. Check for active disputes
      if (booking.transactionId) {
        const activeDispute = await tx.dispute.findFirst({
          where: { transactionId: booking.transactionId, status: 'OPEN' }
        });
        if (activeDispute) throw new Error('Active dispute prevents settlement');
      }

      // 4. Verify financial snapshot
      if (!booking.grossCost || !booking.platformFee || !booking.providerPayout) {
        throw new Error('Financial snapshot missing');
      }

      // 5. Resolve Wallets using TX client to prevent deadlocks
      let payerWallet;
      if (booking.bookedByType === 'FARMER') {
        payerWallet = await tx.wallet.upsert({ where: { farmerId: booking.bookedById }, update: {}, create: { farmerId: booking.bookedById, type: 'USER' } });
      } else {
        payerWallet = await tx.wallet.upsert({ where: { buyerId: booking.bookedById }, update: {}, create: { buyerId: booking.bookedById, type: 'USER' } });
      }

      const providerWallet = await tx.wallet.upsert({ 
        where: { providerId: booking.providerId }, 
        update: {}, 
        create: { providerId: booking.providerId, type: 'USER' } 
      });

      let platformWallet = await tx.wallet.findFirst({ where: { type: 'PLATFORM' } });
      if (!platformWallet) platformWallet = await tx.wallet.create({ data: { type: 'PLATFORM' } });

      // 6. Verify sufficient funds
      if (payerWallet.balance < booking.grossCost) {
        throw new Error('Insufficient balance');
      }

      // 7. Post Ledger Entries
      const reference = `TRANSPORT_SETTLEMENT:${booking.id}`;
      
      // Debit Payer
      const payerBalanceAfter = payerWallet.balance - booking.grossCost;
      await tx.ledgerEntry.create({
        data: {
          walletId: payerWallet.id,
          type: 'DEBIT',
          amount: booking.grossCost,
          description: `Transport cost for Booking ${booking.id.substring(0, 8)}`,
          reference,
          balanceAfter: payerBalanceAfter,
          relatedTransactionId: booking.transactionId ?? null,
        }
      });
      await tx.wallet.update({ where: { id: payerWallet.id }, data: { balance: payerBalanceAfter } });

      // Credit Provider
      const providerBalanceAfter = providerWallet.balance + booking.providerPayout;
      await tx.ledgerEntry.create({
        data: {
          walletId: providerWallet.id,
          type: 'CREDIT',
          amount: booking.providerPayout,
          description: `Transport earnings for Booking ${booking.id.substring(0, 8)}`,
          reference,
          balanceAfter: providerBalanceAfter,
          relatedTransactionId: booking.transactionId ?? null,
        }
      });
      await tx.wallet.update({ where: { id: providerWallet.id }, data: { balance: providerBalanceAfter } });

      // Credit Platform
      if (booking.platformFee > 0) {
        const platformBalanceAfter = platformWallet.balance + booking.platformFee;
        await tx.ledgerEntry.create({
          data: {
            walletId: platformWallet.id,
            type: 'CREDIT',
            amount: booking.platformFee,
            description: `Platform fee for Booking ${booking.id.substring(0, 8)}`,
            reference,
            balanceAfter: platformBalanceAfter,
            relatedTransactionId: booking.transactionId ?? null,
          }
        });
        await tx.wallet.update({ where: { id: platformWallet.id }, data: { balance: platformBalanceAfter } });
      }

      // Audit: Financial Settlement
      await tx.auditLog.create({
        data: {
          action: 'TRANSPORT_FINANCIAL_SETTLED',
          actorType: 'SYSTEM',
          entityType: 'TransportBooking',
          entityId: booking.id,
          after: { payer: booking.bookedByType, grossCost: booking.grossCost, platformFee: booking.platformFee, providerPayout: booking.providerPayout }
        }
      });

      return { success: true, message: 'Settlement successful' };
    }, {
      timeout: 15000 // 15 seconds
    });
  } catch (error: any) {
    console.error('[LEDGER] Transport settlement failed:', error);
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
 */
export async function processTransactionSettlement(transactionId: string, totalValue: number, farmerId: string) {
  const PLATFORM_FEE_RATE = 0.02;
  const platformFee = Math.round((totalValue * PLATFORM_FEE_RATE) * 100) / 100;
  const farmerPayout = Math.round((totalValue - platformFee) * 100) / 100;

  const escrowWalletId = await getOrCreateWalletId(null, 'ESCROW');
  const farmerWalletId = await getOrCreateWalletId(farmerId, 'FARMER');
  const platformWalletId = await getOrCreateWalletId(null, 'PLATFORM');

  await postLedgerEntry({
    walletId: escrowWalletId,
    transactionId,
    type: 'DEBIT',
    amount: totalValue,
    description: `Escrow release for Transaction ${transactionId.substring(0, 8)}`,
    reference: `RELEASE-${transactionId.substring(0, 8)}`
  });

  await postLedgerEntry({
    walletId: farmerWalletId,
    transactionId,
    type: 'CREDIT',
    amount: farmerPayout,
    description: `Sale proceeds for Transaction ${transactionId.substring(0, 8)}`,
    reference: `SETTLE-${transactionId.substring(0, 8)}`
  });

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
 * Processes the financial settlement for a Group Transport Booking.
 * Must be atomic and idempotent. Splits cost among participating farmers.
 */
export async function processGroupTransportSettlement(bookingId: string): Promise<{ success: boolean; message: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Atomically claim the settlement
      const booking = await tx.transportBooking.update({
        where: { id: bookingId, financialSettled: false },
        data: { financialSettled: true },
        include: { 
          allocations: true,
          transaction: true,
          groupTransaction: true
        }
      }).catch(() => null);

      if (!booking) {
        const existing = await tx.transportBooking.findUnique({ where: { id: bookingId } });
        if (existing && existing.financialSettled) return { success: true, message: 'Already settled' };
        throw new Error('Booking not found or state invalid');
      }

      if (booking.status !== 'COMPLETED') throw new Error('Booking is not COMPLETED');

      // 2. Check for active disputes
      const disputeTxId = booking.transactionId || booking.groupTransactionId;
      if (disputeTxId) {
        const activeDispute = await tx.dispute.findFirst({ where: { transactionId: disputeTxId, status: 'OPEN' } });
        if (activeDispute) throw new Error('Active dispute prevents settlement');
      }

      if (!booking.grossCost || !booking.platformFee || !booking.providerPayout) throw new Error('Financial snapshot missing');

      // 3. Resolve Wallets
      const providerWallet = await tx.wallet.upsert({ 
        where: { providerId: booking.providerId }, 
        update: {}, 
        create: { providerId: booking.providerId, type: 'USER' } 
      });
      let platformWallet = await tx.wallet.findFirst({ where: { type: 'PLATFORM' } });
      if (!platformWallet) platformWallet = await tx.wallet.create({ data: { type: 'PLATFORM' } });

      // 4. Determine Payer (FARMER_PAYS vs BUYER_PAYS)
      // For Phase G, we assume FARMER_PAYS if allocations exist, otherwise BUYER_PAYS
      if (booking.allocations.length > 0) {
        // FARMER_PAYS: Split among farmers
        let totalAllocated = 0;
        const farmerWallets = [];

        for (const alloc of booking.allocations) {
          const fWallet = await tx.wallet.upsert({ 
            where: { farmerId: alloc.farmerId }, 
            update: {}, 
            create: { farmerId: alloc.farmerId, type: 'USER' } 
          });
          if (fWallet.balance < alloc.shareAmount) {
            throw new Error(`Insufficient balance for farmer ${alloc.farmerId}`);
          }
          farmerWallets.push({ alloc, wallet: fWallet });
          totalAllocated += alloc.shareAmount;
        }

        if (Math.round(totalAllocated * 100) !== Math.round(booking.grossCost * 100)) {
          throw new Error('Allocation total does not match gross cost');
        }

        // Debit Farmers
        for (const fw of farmerWallets) {
          const balanceAfter = fw.wallet.balance - fw.alloc.shareAmount;
          await tx.ledgerEntry.create({
            data: {
              walletId: fw.wallet.id,
              type: 'DEBIT',
              amount: fw.alloc.shareAmount,
              description: `Group transport share for Booking ${booking.id.substring(0, 8)}`,
              reference: `TRANSPORT_SETTLEMENT:${booking.id}`,
              balanceAfter,
              relatedTransactionId: booking.transactionId ?? booking.groupTransactionId ?? null,
            }
          });
          await tx.wallet.update({ where: { id: fw.wallet.id }, data: { balance: balanceAfter } });
          await tx.transportCostAllocation.update({ where: { id: fw.alloc.id }, data: { isSettled: true } });
        }
      } else {
        // BUYER_PAYS: Single payer
        const buyerWallet = await tx.wallet.upsert({ 
          where: { buyerId: booking.bookedById }, 
          update: {}, 
          create: { buyerId: booking.bookedById, type: 'USER' } 
        });
        if (buyerWallet.balance < booking.grossCost) throw new Error('Insufficient balance');
        
        const balanceAfter = buyerWallet.balance - booking.grossCost;
        await tx.ledgerEntry.create({
          data: {
            walletId: buyerWallet.id,
            type: 'DEBIT',
            amount: booking.grossCost,
            description: `Transport cost for Booking ${booking.id.substring(0, 8)}`,
            reference: `TRANSPORT_SETTLEMENT:${booking.id}`,
            balanceAfter,
            relatedTransactionId: booking.transactionId ?? booking.groupTransactionId ?? null,
          }
        });
        await tx.wallet.update({ where: { id: buyerWallet.id }, data: { balance: balanceAfter } });
      }

      // 5. Credit Provider
      const providerBalanceAfter = providerWallet.balance + booking.providerPayout;
      await tx.ledgerEntry.create({
        data: {
          walletId: providerWallet.id,
          type: 'CREDIT',
          amount: booking.providerPayout,
          description: `Transport earnings for Booking ${booking.id.substring(0, 8)}`,
          reference: `TRANSPORT_SETTLEMENT:${booking.id}`,
          balanceAfter: providerBalanceAfter,
          relatedTransactionId: booking.transactionId ?? booking.groupTransactionId ?? null,
        }
      });
      await tx.wallet.update({ where: { id: providerWallet.id }, data: { balance: providerBalanceAfter } });

      // 6. Credit Platform
      if (booking.platformFee > 0) {
        const platformBalanceAfter = platformWallet.balance + booking.platformFee;
        await tx.ledgerEntry.create({
          data: {
            walletId: platformWallet.id,
            type: 'CREDIT',
            amount: booking.platformFee,
            description: `Platform fee for Booking ${booking.id.substring(0, 8)}`,
            reference: `TRANSPORT_SETTLEMENT:${booking.id}`,
            balanceAfter: platformBalanceAfter,
            relatedTransactionId: booking.transactionId ?? booking.groupTransactionId ?? null,
          }
        });
        await tx.wallet.update({ where: { id: platformWallet.id }, data: { balance: platformBalanceAfter } });
      }

      return { success: true, message: 'Settlement successful' };
    }, {
      timeout: 15000
    });
  } catch (error: any) {
    console.error('[LEDGER] Group transport settlement failed:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error;
  }
}
