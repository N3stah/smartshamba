import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { getOrCreateWalletId } from '@/lib/finance/ledger-service';
import { postLedgerEntry } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const requests = await (prisma as any).withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('[API] Fetch withdrawals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { id, action, mpesaRef } = await req.json();
    const request = await (prisma as any).withdrawalRequest.findUnique({ where: { id } });

    if (!request || request.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // 1. Update Request Status
      await (prisma as any).withdrawalRequest.update({
        where: { id },
        data: { status: 'COMPLETED', processedAt: new Date(), mpesaRef }
      });

      // 2. Debit Farmer Wallet (Double-Entry)
      await postLedgerEntry({
        walletId: request.walletId,
        type: 'DEBIT',
        amount: request.amount,
        description: `Withdrawal to M-PESA (Ref: ${mpesaRef})`,
        reference: `WDL-${id.substring(0, 8)}`
      });

      // 3. Credit Platform Cash Out Wallet
      const cashoutWalletId = await getOrCreateWalletId(null, 'PLATFORM');
      await postLedgerEntry({
        walletId: cashoutWalletId,
        type: 'CREDIT',
        amount: request.amount,
        description: `M-PESA B2C Payout to ${request.userId} (Ref: ${mpesaRef})`,
        reference: `B2C-${id.substring(0, 8)}`
      });

    } else if (action === 'REJECT') {
      await (prisma as any).withdrawalRequest.update({
        where: { id },
        data: { status: 'REJECTED', processedAt: new Date() }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Process withdrawal error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
