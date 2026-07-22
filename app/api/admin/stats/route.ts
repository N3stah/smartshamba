import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalFarmers,
      totalBuyers,
      totalTransactions,
      settledTransactions,
      pendingTransactions,
      disputedTransactions,
      activeFarmers,
      groupTransactions,
      activeGroups,
      bagAgg,
      recentTransactions,
    ] = await Promise.all([
      prisma.farmer.count(),
      prisma.buyer.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'SETTLED' } }),
      prisma.transaction.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
      prisma.transaction.count({ where: { status: 'DISPUTED' } }),
      prisma.farmer.count({
        where: {
          transactions: {
            some: {
              createdAt: { gte: thirtyDaysAgo }
            }
          }
        }
      }),
      prisma.groupTransaction.count(),
      prisma.farmerGroup.count({
        where: {
          transactions: {
            some: {
              createdAt: { gte: thirtyDaysAgo }
            }
          }
        }
      }),
      prisma.transaction.aggregate({ _avg: { quantityBags: true } }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          farmer: { select: { name: true, phone: true } },
          buyer: { select: { name: true } },
        },
      }),
    ]);

    const completionRate = totalTransactions > 0 
      ? parseFloat(((settledTransactions / totalTransactions) * 100).toFixed(2)) 
      : 0;

    const disputeRate = totalTransactions > 0
      ? parseFloat(((disputedTransactions / totalTransactions) * 100).toFixed(2))
      : 0;

    return NextResponse.json({
      // Core counts
      totalFarmers,
      totalBuyers,
      totalTransactions,
      // Transaction status breakdown
      settledTransactions,
      pendingTransactions,
      disputedTransactions,
      // Phase 11: Internal analytics
      activeFarmersLast30Days: activeFarmers,
      groupActivity: {
        totalGroupTransactions: groupTransactions,
        activeGroupsLast30Days: activeGroups,
      },
      averageBagsPerTransaction: bagAgg._avg?.quantityBags ?? 0,
      completionRate,
      disputeRate,
      // Recent activity
      recentTransactions,
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching stats:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
