import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { weeklyMarketReportTemplate } from '@/lib/notifications/templates';

// Vercel Cron: runs every Sunday at 08:00 EAT
// Add to vercel.json: { "crons": [{ "path": "/api/cron/market-report", "schedule": "0 5 * * 0" }] }
// Secured by CRON_SECRET header set in Vercel environment variables

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    secret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Aggregate average settled price per buyer over the past 7 days
    const pricesByBuyer = await prisma.transaction.groupBy({
      by: ['buyerId'],
      where: {
        status: 'SETTLED',
        createdAt: { gte: weekAgo },
      },
      _avg: { pricePerBag: true },
      _count: { id: true },
      orderBy: { _avg: { pricePerBag: 'desc' } },
    });

    if (pricesByBuyer.length === 0) {
      console.log('[NOTIFICATIONS] Market report: no settled transactions this week, skipping');
      return NextResponse.json({ skipped: true, reason: 'No settled transactions this week' });
    }

    // Fetch buyer names
    const buyerIds = pricesByBuyer.map((p) => p.buyerId);
    const buyers   = await prisma.buyer.findMany({
      where: { id: { in: buyerIds } },
      select: { id: true, name: true },
    });
    const buyerMap = new Map(buyers.map((b) => [b.id, b.name]));

    const entries = pricesByBuyer
      .filter((p) => p._avg.pricePerBag !== null)
      .map((p) => ({
        buyerName: buyerMap.get(p.buyerId) ?? 'Unknown',
        avgPrice:  Math.round(p._avg.pricePerBag!),
      }));

    // Highest county this week (by average settled price)
    const pricesByCounty = await prisma.transaction.groupBy({
      by: ['farmerId'],
      where: { status: 'SETTLED', createdAt: { gte: weekAgo } },
      _avg: { pricePerBag: true },
    });

    // Get farmers with counties
    const farmerIds    = pricesByCounty.map((p) => p.farmerId);
    const farmersGeo   = await prisma.farmer.findMany({
      where: { id: { in: farmerIds } },
      select: { id: true, county: { select: { name: true } } },
    });
    const farmerCounty = new Map(farmersGeo.map((f) => [f.id, f.county?.name ?? null]));

    // Group by county
    const countyTotals: Record<string, { sum: number; count: number }> = {};
    for (const p of pricesByCounty) {
      const county = farmerCounty.get(p.farmerId);
      if (!county || p._avg.pricePerBag === null) continue;
      if (!countyTotals[county]) countyTotals[county] = { sum: 0, count: 0 };
      countyTotals[county].sum   += p._avg.pricePerBag;
      countyTotals[county].count += 1;
    }
    const countyAvgs = Object.entries(countyTotals).map(([name, { sum, count }]) => ({
      name,
      avg: Math.round(sum / count),
    }));
    countyAvgs.sort((a, b) => b.avg - a.avg);
    const topCounty = countyAvgs[0];

    const weekEnding = new Date().toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

    const body = weeklyMarketReportTemplate({
      weekEnding,
      entries,
      highestCounty: topCounty?.name,
      highestPrice:  topCounty?.avg,
    });

    // Send to all opted-in farmers
    const farmers = await prisma.farmer.findMany({
      where: {
        OR: [
          { notificationPreference: null },
          { notificationPreference: { weeklyMarketReport: true } },
        ],
      },
      select: { id: true, phone: true },
    });

    console.log('[NOTIFICATIONS] Sending weekly market report to', farmers.length, 'farmers');

    let sent    = 0;
    let skipped = 0;
    for (const farmer of farmers) {
      const result = await sendNotification({
        type:           'WEEKLY_MARKET_REPORT',
        recipientPhone: farmer.phone,
        body,
        farmerId:       farmer.id,
      });
      if (result.success) sent++; else skipped++;
    }

    console.log('[NOTIFICATIONS] Market report done. Sent:', sent, 'Skipped/failed:', skipped);
    return NextResponse.json({ success: true, sent, skipped, weekEnding });
  } catch (error) {
    console.error('[NOTIFICATIONS] Cron market report error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}