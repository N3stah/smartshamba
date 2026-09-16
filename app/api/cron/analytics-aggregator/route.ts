import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Aggregating daily metrics...');

    // We aggregate up to the start of today (UTC)
    // This ensures the day is complete and the snapshot is immutable
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // The snapshot date is "yesterday"
    const snapshotDate = new Date(startOfToday);
    snapshotDate.setUTCDate(snapshotDate.getUTCDate() - 1);

    const [
      totalFarmers, totalBuyers, totalTx, settledTx, disputedTx,
      completedTransport, failedTransport, activeListings, activeDemands,
      totalRevenue, platinumUsers, suspiciousAccounts
    ] = await Promise.all([
      prisma.farmer.count({ where: { createdAt: { lt: startOfToday } } }),
      prisma.buyer.count({ where: { createdAt: { lt: startOfToday } } }),
      prisma.transaction.count({ where: { createdAt: { lt: startOfToday } } }),
      prisma.transaction.count({ where: { status: 'SETTLED', createdAt: { lt: startOfToday } } }),
      prisma.transaction.count({ where: { status: 'DISPUTED', createdAt: { lt: startOfToday } } }),
      prisma.transportBooking.count({ where: { status: 'DELIVERED', createdAt: { lt: startOfToday } } }),
      prisma.transportBooking.count({ where: { status: 'CANCELLED', createdAt: { lt: startOfToday } } }),
      prisma.produceListing.count({ where: { status: 'ACTIVE', createdAt: { lt: startOfToday } } }),
      prisma.buyerDemand.count({ where: { status: 'ACTIVE', createdAt: { lt: startOfToday } } }),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, where: { status: 'SETTLED', createdAt: { lt: startOfToday } } }),
      prisma.trustScore.count({ where: { level: 'PLATINUM' } }),
      prisma.trustScore.count({ where: { score: { lt: 40 } } })
    ]);

    const metrics = {
      totalFarmers,
      totalBuyers,
      totalTx,
      settledTx,
      disputedTx,
      completedTransport,
      failedTransport,
      activeListings,
      activeDemands,
      totalRevenue: totalRevenue._sum.totalValue || 0,
      platinumUsers,
      suspiciousAccounts
    };

    // Idempotent upsert
    await prisma.dailyMetric.upsert({
      where: { date: snapshotDate },
      update: { metrics: metrics as any },
      create: { date: snapshotDate, metrics: metrics as any }
    });

    console.log(`[CRON] Daily metrics aggregated for ${snapshotDate.toISOString().split('T')[0]}`);
    return NextResponse.json({ success: true, date: snapshotDate.toISOString().split('T')[0] });
  } catch (error) {
    console.error('[CRON] Analytics aggregator error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
