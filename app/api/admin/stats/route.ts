import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalFarmers, totalBuyers, totalTransactions, settledTransactions,
      pendingTransactions, disputedTransactions, activeFarmers, groupTransactions,
      activeGroups, bagAgg, recentTransactions, recentSales, newFarmers
    ] = await Promise.all([
      prisma.farmer.count(),
      prisma.buyer.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'SETTLED' } }),
      prisma.transaction.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
      prisma.transaction.count({ where: { status: 'DISPUTED' } }),
      prisma.farmer.count({ where: { transactions: { some: { createdAt: { gte: thirtyDaysAgo } } } } }),
      prisma.groupTransaction.count(),
      prisma.farmerGroup.count({ where: { transactions: { some: { createdAt: { gte: thirtyDaysAgo } } } } }),
      prisma.transaction.aggregate({ _avg: { quantityBags: true } }),
      prisma.transaction.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { farmer: { select: { name: true, phone: true } }, buyer: { select: { name: true } } } }),
      prisma.transaction.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true, totalValue: true } }),
      prisma.farmer.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } })
    ]);

    const completionRate = totalTransactions > 0 ? parseFloat(((settledTransactions / totalTransactions) * 100).toFixed(2)) : 0;
    const disputeRate = totalTransactions > 0 ? parseFloat(((disputedTransactions / totalTransactions) * 100).toFixed(2)) : 0;

    const salesTrend = recentSales.reduce((acc: any, tx) => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, revenue: tx.totalValue, count: 0 };
      acc[date].revenue += tx.totalValue;
      acc[date].count += 1;
      return acc;
    }, {});

    const registrationTrend = newFarmers.reduce((acc: any, farmer) => {
      const date = new Date(farmer.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, farmers: 0 };
      acc[date].farmers += 1;
      return acc;
    }, {});

    return NextResponse.json({
      kpis: {
        totalFarmers, totalBuyers, totalTransactions, settledTransactions,
        pendingTransactions, disputedTransactions, activeFarmersLast30Days: activeFarmers,
        groupActivity: { totalGroupTransactions: groupTransactions, activeGroupsLast30Days: activeGroups },
        averageBagsPerTransaction: bagAgg._avg.quantityBags || 0,
        completionRate, disputeRate, recentTransactions
      },
      charts: {
        salesTrend: Object.values(salesTrend),
        registrationTrend: Object.values(registrationTrend)
      }
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching stats:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
