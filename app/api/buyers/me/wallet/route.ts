import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';
import { getOrCreateWalletId } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getBuyerSession(req);

    const buyer = await prisma.buyer.findUnique({ where: { phone: phone as string } });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const walletId = await getOrCreateWalletId(buyer.id, 'BUYER');
    
    const [wallet, entries] = await Promise.all([
      prisma.wallet.findUnique({ where: { id: walletId } }),
      prisma.ledgerEntry.findMany({
        where: { walletId: walletId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    return NextResponse.json({ balance: wallet?.balance || 0, entries });
  } catch (error) {
    console.error('[API] Buyer wallet error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
