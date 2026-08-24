import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getBuyerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({ where: { phone } });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const [balance, entries] = await Promise.all([
      getWalletBalance(buyer.id, 'BUYER'),
      (prisma as any).ledgerEntry.findMany({
        where: { userId: buyer.id, userType: 'BUYER' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    return NextResponse.json({ balance, entries });
  } catch (error) {
    console.error('[API] Buyer wallet error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
