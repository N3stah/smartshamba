import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const [balance, entries] = await Promise.all([
      getWalletBalance(farmer.id, 'FARMER'),
      (prisma as any).ledgerEntry.findMany({
        where: { userId: farmer.id, userType: 'FARMER' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    return NextResponse.json({ balance, entries });
  } catch (error) {
    console.error('[API] Farmer wallet error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
