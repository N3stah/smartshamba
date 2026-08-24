import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { getOrCreateWalletId } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);

    const farmer = await prisma.farmer.findUnique({ where: { phone: phone as string } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const walletId = await getOrCreateWalletId(farmer.id, 'FARMER');
    
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
    console.error('[API] Farmer wallet error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
