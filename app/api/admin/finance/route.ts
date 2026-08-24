import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    // Calculate Platform Revenue (Fees)
    const platformRevenue = await getWalletBalance('platform', 'PLATFORM');

    // Calculate Total Liabilities (Sum of all Farmer and Buyer balances)
    // In a real system, we'd cache this or run a raw SQL query for performance.
    const farmers = await prisma.farmer.findMany({ select: { id: true } });
    const buyers = await prisma.buyer.findMany({ select: { id: true } });

    let farmerLiabilities = 0;
    for (const f of farmers) {
      farmerLiabilities += await getWalletBalance(f.id, 'FARMER');
    }

    let buyerLiabilities = 0;
    for (const b of buyers) {
      buyerLiabilities += await getWalletBalance(b.id, 'BUYER');
    }

    // Fetch recent ledger entries for the audit feed
    const recentEntries = await (prisma as any).ledgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        transaction: { select: { reference: true } }
      }
    });

    return NextResponse.json({
      kpis: {
        platformRevenue,
        farmerLiabilities,
        buyerLiabilities,
        totalLiabilities: farmerLiabilities + buyerLiabilities
      },
      recentEntries
    });
  } catch (error) {
    console.error('[API] Admin finance error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
