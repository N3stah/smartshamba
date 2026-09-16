import { NextRequest, NextResponse } from 'next/server';
import { prisma, withDatabaseRetry } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CFO, StaffRole.CTO, StaffRole.PM]);
    if (authError) return authError;

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // 1. Fetch latest historical snapshot (yesterday)
    const latestSnapshot = await prisma.dailyMetric.findFirst({
      where: { date: { lt: startOfToday } },
      orderBy: { date: 'desc' }
    });

    const snapshot = latestSnapshot?.metrics as any || {
      totalFarmers: 0, totalBuyers: 0, totalTx: 0, settledTx: 0, disputedTx: 0,
      completedTransport: 0, failedTransport: 0, activeListings: 0, activeDemands: 0,
      totalRevenue: 0, platinumUsers: 0, suspiciousAccounts: 0
    };

    // 2. Fetch bounded live queries for "today"
    const results = await withDatabaseRetry(() => Promise.all([
      prisma.farmer.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.buyer.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.transaction.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.transaction.count({ where: { status: 'SETTLED', createdAt: { gte: startOfToday } } }),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, where: { status: 'SETTLED', createdAt: { gte: startOfToday } } }),
      prisma.produceListing.count({ where: { status: 'ACTIVE', createdAt: { gte: startOfToday } } }),
      prisma.buyerDemand.count({ where: { status: 'ACTIVE', createdAt: { gte: startOfToday } } }),
      prisma.notification.count({ where: { status: 'SENT', createdAt: { gte: startOfToday } } }),
      prisma.notification.count({ where: { status: 'FAILED', createdAt: { gte: startOfToday } } }),
      prisma.buyerDemand.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } }),
      prisma.produceListing.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } })
    ]));

    const [
      newFarmersToday, newBuyersToday, newTxToday, settledTxToday,
      revenueToday, activeListingsToday, activeDemandsToday,
      smsSentToday, smsFailedToday, cropDemand, tradedCrops
    ] = results;

    // 3. Combine
    const totalFarmers = snapshot.totalFarmers + newFarmersToday;
    const totalBuyers = snapshot.totalBuyers + newBuyersToday;
    const totalTx = snapshot.totalTx + newTxToday;
    const settledTx = snapshot.settledTx + settledTxToday;
    const totalRevenue = snapshot.totalRevenue + (revenueToday._sum.totalValue || 0);
    const activeListings = snapshot.activeListings + activeListingsToday;
    const activeDemands = snapshot.activeDemands + activeDemandsToday;

    const successRate = totalTx > 0 ? (settledTx / totalTx) * 100 : 0;

    return NextResponse.json({
      kpis: {
        totalFarmers, totalBuyers,
        activeListings, activeDemands,
        totalTx,
        settledTx,
        totalRevenue,
        successRate: successRate.toFixed(1),
      },
      charts: {
        cropDemand: cropDemand.map(c => ({ name: c.product, bags: c._sum.quantityBags || 0 })),
        tradedCrops: tradedCrops.map(c => ({ name: c.product, bags: c._sum.quantityBags || 0 }))
      },
      system: {
        smsSent: smsSentToday,
        smsFailed: smsFailedToday,
        smsSuccessRate: smsSentToday + smsFailedToday > 0 ? (smsSentToday / (smsSentToday + smsFailedToday)) * 100 : 100
      }
    });
  } catch (error) {
    console.error('[ADMIN] Analytics error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
