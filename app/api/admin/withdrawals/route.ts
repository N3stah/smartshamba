import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { postLedgerEntry } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const requests = await prisma.withdrawalRequest.findMany({
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
    const request = await prisma.withdrawalRequest.findUnique({ where: { id } });

    if (!request || request.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // 1. Update Request Status
      await prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'COMPLETED', processedAt: new Date(), mpesaRef }
      });

      // 2. Debit Farmer Wallet (Double-Entry)
      await postLedgerEntry({
        userId: request.userId,
        userType: request.userType,
        entryType: 'DEBIT',
        amount: request.amount,
        description: `Withdrawal to M-PESA (Ref: ${mpesaRef})`,
        reference: `WDL-${id.substring(0, 8)}`
      });

      // 3. Credit Platform Cash Out Wallet
      await postLedgerEntry({
        userId: 'cashout',
        userType: 'PLATFORM',
        entryType: 'CREDIT',
        amount: request.amount,
        description: `M-PESA B2C Payout to ${request.userId} (Ref: ${mpesaRef})`,
        reference: `B2C-${id.substring(0, 8)}`
      });

    } else if (action === 'REJECT') {
      await prisma.withdrawalRequest.update({
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
