import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const [
      totalFarmers,
      totalBuyers,
      totalTransactions,
      pendingTransactions,
      confirmedTransactions,
      transactionVolume,
    ] = await Promise.all([
      prisma.farmer.count(),
      prisma.buyer.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: 'CONFIRMED' } }),
      prisma.transaction.aggregate({
        _sum: { totalValue: true, quantityBags: true },
      }),
    ]);

    return NextResponse.json({
      farmers:      totalFarmers,
      buyers:       totalBuyers,
      transactions: {
        total:     totalTransactions,
        pending:   pendingTransactions,
        confirmed: confirmedTransactions,
      },
      volume: {
        totalBags:  transactionVolume._sum.quantityBags ?? 0,
        totalValue: transactionVolume._sum.totalValue ?? 0,
      },
    });
  } catch (error) {
    console.error('[ADMIN] Stats error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
