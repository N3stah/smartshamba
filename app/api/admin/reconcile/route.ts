import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { getOrCreateWalletId } from '@/lib/finance/ledger-service';
import { processTransactionSettlement, postLedgerEntry } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { transactionId, mpesaRef } = await req.json();
    if (!transactionId || !mpesaRef) {
      return NextResponse.json({ error: 'Transaction ID and M-PESA Ref are required' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { farmer: true, buyer: true }
    });

    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (transaction.status === 'SETTLED') return NextResponse.json({ error: 'Transaction already settled' }, { status: 400 });

    // 1. Record Buyer Payment (Debit Buyer, Credit Escrow)
    await postLedgerEntry({
      walletId: transaction.buyerId,
      transactionId: transaction.id,
      type: 'DEBIT',
      amount: transaction.totalValue,
      description: `Offline payment matched for Tx ${transaction.reference.substring(0, 8)}`,
      reference: mpesaRef
    });
    const buyerWalletId = await getOrCreateWalletId(transaction.buyerId, 'BUYER');
    await postLedgerEntry({
      walletId: buyerWalletId,
      transactionId: transaction.id,
      type: 'CREDIT',
      amount: transaction.totalValue,
      description: `Escrow received (Offline) for Tx ${transaction.reference.substring(0, 8)}`,
      reference: mpesaRef
    });

    // 2. Process Settlement (Release Escrow, Pay Farmer, Take Fee)
    await processTransactionSettlement(transaction.id, transaction.totalValue, transaction.farmerId);

    // 3. Update Transaction Status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'SETTLED', mpesaRef }
    });

    // 4. Generate Receipt
    const crypto = require('crypto');
    const receiptHash = crypto.createHash('sha256').update(`${transaction.id}${mpesaRef}${transaction.totalValue}`).digest('hex');
    await (prisma as any).receipt.create({
      data: {
        transactionId: transaction.id,
        walletId: transaction.buyerId,
        amount: transaction.totalValue,
        mpesaRef,
        data: { crop: 'Maize', bags: transaction.quantityBags, reference: transaction.reference, hash: receiptHash }
      }
    });

    return NextResponse.json({ success: true, message: 'Transaction reconciled and settled successfully.' });
  } catch (error) {
    console.error('[API] Reconciliation error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
