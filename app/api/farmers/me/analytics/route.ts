import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';
    
    const now = new Date();
    let startDate = new Date();
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalTransactions, settledTransactions, activeListings, pendingTransactions,
      totalBags, totalEarnings, avgRating, recentSales, cropPerformance,
      thisMonthEarnings, lastMonthEarnings,
      topBuyers, groupsJoined, groupEarnings, unreadNotifications, positiveRatings,
      marketDemand
    ] = await Promise.all([
      prisma.transaction.count({ where: { farmerId: farmer.id } }),
      prisma.transaction.count({ where: { farmerId: farmer.id, status: 'SETTLED' } }),
      prisma.produceListing.count({ where: { farmerId: farmer.id, status: 'ACTIVE' } }),
      prisma.transaction.count({ where: { farmerId: farmer.id, status: { in: ['PENDING', 'AGREED', 'DELIVERY_SCHEDULED'] } } }),
      prisma.transaction.aggregate({ _sum: { quantityBags: true }, where: { farmerId: farmer.id, status: 'SETTLED' } }),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, where: { farmerId: farmer.id, status: 'SETTLED' } }),
      prisma.rating.aggregate({ _avg: { score: true }, where: { farmerId: farmer.id } }),
      prisma.transaction.findMany({ where: { farmerId: farmer.id, status: 'SETTLED', createdAt: { gte: startDate } }, select: { createdAt: true, totalValue: true, quantityBags: true, pricePerBag: true }, orderBy: { createdAt: 'desc' } }),
      prisma.produceListing.groupBy({ by: ['product'], where: { farmerId: farmer.id, status: 'CLOSED' }, _sum: { quantityBags: true }, _avg: { pricePerBag: true } }),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, where: { farmerId: farmer.id, status: 'SETTLED', createdAt: { gte: startOfMonth } } }),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, where: { farmerId: farmer.id, status: 'SETTLED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.transaction.groupBy({
        by: ['buyerId'],
        where: { farmerId: farmer.id, status: 'SETTLED' },
        _sum: { totalValue: true },
        _count: { id: true },
        orderBy: { _sum: { totalValue: 'desc' } },
        take: 5
      }),
      prisma.groupMember.count({ where: { farmerId: farmer.id } }),
      prisma.groupTransaction.aggregate({ _sum: { totalValue: true }, where: { group: { members: { some: { farmerId: farmer.id } } }, status: 'SETTLED' } }),
      prisma.notification.count({ where: { farmerId: farmer.id, status: 'SENT' } }),
      prisma.rating.count({ where: { farmerId: farmer.id, score: { gte: 4 } } }),
      prisma.buyerDemand.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } })
    ]);

    const buyerIds = topBuyers.map(t => t.buyerId);
    const buyers = await prisma.buyer.findMany({ where: { id: { in: buyerIds } }, select: { id: true, name: true } });
    const buyerMap = new Map(buyers.map(b => [b.id, b.name]));
    
    const formattedTopBuyers = topBuyers.map(t => ({
      name: buyerMap.get(t.buyerId) || 'Unknown Buyer',
      spent: t._sum.totalValue || 0,
      txs: t._count.id
    }));

    const salesTrend = recentSales.reduce((acc: any, tx) => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, revenue: tx.totalValue, bags: tx.quantityBags };
      else {
        acc[date].revenue += tx.totalValue;
        acc[date].bags += tx.quantityBags;
      }
      return acc;
    }, {});

    // Calculate Price Trend (Average price per bag per day)
    const priceTrend = recentSales.reduce((acc: any, tx) => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, totalValue: 0, totalBags: 0 };
      acc[date].totalValue += tx.totalValue;
      acc[date].totalBags += tx.quantityBags;
      return acc;
    }, {});

    const formattedPriceTrend = Object.values(priceTrend).map((d: any) => ({
      date: d.date,
      avgPrice: d.totalBags > 0 ? d.totalValue / d.totalBags : 0
    })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const insights: string[] = [];
    const currentEarn = thisMonthEarnings._sum.totalValue || 0;
    const lastEarn = lastMonthEarnings._sum.totalValue || 0;
    
    if (lastEarn > 0) {
      const change = ((currentEarn - lastEarn) / lastEarn) * 100;
      if (change > 0) insights.push(`You earned ${change.toFixed(0)}% more this month than last month.`);
      else if (change < 0) insights.push(`Your earnings decreased by ${Math.abs(change).toFixed(0)}% compared to last month.`);
    } else if (currentEarn > 0) {
      insights.push("You started earning this month! Keep up the good work.");
    }

    if (cropPerformance.length > 1) {
      const topCrop = cropPerformance.reduce((a, b) => ((a._sum.quantityBags || 0) > (b._sum.quantityBags || 0) ? a : b));
      insights.push(`${topCrop.product} is your top selling crop by volume.`);
    }

    return NextResponse.json({
      kpis: {
        totalTransactions, settledTransactions, activeListings, pendingTransactions,
        totalBags: totalBags._sum.quantityBags || 0,
        totalEarnings: totalEarnings._sum.totalValue || 0,
        avgRating: avgRating._avg.score || 0,
        groupsJoined,
        groupEarnings: groupEarnings._sum.totalValue || 0,
        positiveRatings
      },
      charts: {
        salesTrend: Object.values(salesTrend),
        cropPerformance: cropPerformance.map(c => ({ name: c.product, bags: c._sum.quantityBags || 0, avgPrice: c._avg.pricePerBag || 0 })),
        topBuyers: formattedTopBuyers,
        marketDemand: marketDemand.map(d => ({ name: d.product, bags: d._sum.quantityBags || 0 })),
        priceTrend: formattedPriceTrend
      },
      insights
    });
  } catch (error) {
    console.error('[FARMER] Analytics error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
