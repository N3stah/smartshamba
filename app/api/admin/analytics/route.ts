import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

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
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalFarmers, verifiedFarmers, totalBuyers, verifiedBuyers,
      activeListings, activeDemands, openTransactions, closedTransactions,
      txAggregates, recentTransactions, newFarmers, cropDemand,
      thisMonthReg, lastMonthReg, smsSent, smsFailed, otpRequests, topCounties,
      totalDisputes, resolvedDisputes, totalGroups, completedGroupTx,
      tradedCrops
    ] = await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.count({ where: { verified: true } }),
      prisma.buyer.count(),
      prisma.buyer.count({ where: { verified: true } }),
      prisma.produceListing.count({ where: { status: 'ACTIVE' } }),
      prisma.buyerDemand.count({ where: { status: 'ACTIVE' } }),
      prisma.transaction.count({ where: { status: { in: ['PENDING', 'AGREED', 'DELIVERY_SCHEDULED', 'DELIVERED'] } } }),
      prisma.transaction.count({ where: { status: 'CLOSED' } }),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, _avg: { totalValue: true }, _max: { totalValue: true }, where: { status: 'SETTLED' } }),
      prisma.transaction.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, totalValue: true } }),
      prisma.farmer.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true } }),
      prisma.buyerDemand.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } }),
      prisma.farmer.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.farmer.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.notification.count({ where: { status: 'SENT', createdAt: { gte: startDate } } }),
      prisma.notification.count({ where: { status: 'FAILED', createdAt: { gte: startDate } } }),
      prisma.otpCode.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.farmer.groupBy({ by: ['countyId'], where: { countyId: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: 'RESOLVED' } }),
      prisma.farmerGroup.count(),
      prisma.groupTransaction.count({ where: { status: 'SETTLED' } }),
      prisma.produceListing.groupBy({ by: ['product'], where: { status: 'CLOSED' }, _sum: { quantityBags: true } })
    ]);

    // Fetch resolved disputes to calculate average resolution time
    const resolvedDisputesData = await prisma.dispute.findMany({
      where: { status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true }
    });

    let avgResolutionHours = 0;
    if (resolvedDisputesData.length > 0) {
      const totalHours = resolvedDisputesData.reduce((sum, d) => {
        const diff = new Date(d.resolvedAt!).getTime() - new Date(d.createdAt).getTime();
        return sum + (diff / (1000 * 60 * 60));
      }, 0);
      avgResolutionHours = totalHours / resolvedDisputesData.length;
    }

    const countyIds = topCounties.map(c => c.countyId).filter(Boolean) as string[];
    const counties = await prisma.county.findMany({ where: { id: { in: countyIds } }, select: { id: true, name: true } });
    const countyMap = new Map(counties.map(c => [c.id, c.name]));
    const formattedTopCounties = topCounties.map(c => ({ name: countyMap.get(c.countyId!) || 'Unknown', farmers: c._count.id }));

    const salesTrend = recentTransactions.reduce((acc: any, tx) => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, revenue: 0, count: 0 };
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

    const insights: string[] = [];
    if (lastMonthReg > 0) {
      const growth = ((thisMonthReg - lastMonthReg) / lastMonthReg) * 100;
      if (growth > 0) insights.push(`Farmer registrations grew by ${growth.toFixed(0)}% this month.`);
    }
    if (cropDemand.length > 0) {
      const topDemand = cropDemand.reduce((a, b) => ((a._sum.quantityBags || 0) > (b._sum.quantityBags || 0) ? a : b));
      insights.push(`Current top buyer demand is for ${topDemand.product}.`);
    }
    if (topCounties.length > 0) {
      insights.push(`${formattedTopCounties[0].name} has the highest farmer registrations.`);
    }
    
    const totalTxCount = openTransactions + closedTransactions;
    const successRate = totalTxCount > 0 ? (closedTransactions / totalTxCount) * 100 : 0;
    const disputeRate = totalTxCount > 0 ? (totalDisputes / totalTxCount) * 100 : 0;

    return NextResponse.json({
      kpis: {
        totalFarmers, verifiedFarmers, totalBuyers, verifiedBuyers,
        pendingFarmers: totalFarmers - verifiedFarmers,
        pendingBuyers: totalBuyers - verifiedBuyers,
        activeListings, activeDemands, openTransactions, closedTransactions,
        totalRevenue: txAggregates._sum.totalValue || 0,
        avgTxValue: txAggregates._avg.totalValue || 0,
        largestTx: txAggregates._max.totalValue || 0,
        successRate: successRate.toFixed(1),
        disputeRate: disputeRate.toFixed(1),
        resolvedDisputes,
        avgResolutionHours: avgResolutionHours.toFixed(1),
        totalGroups,
        completedGroupTx
      },
      charts: {
        salesTrend: Object.values(salesTrend),
        registrationTrend: Object.values(registrationTrend),
        cropDemand: cropDemand.map(c => ({ name: c.product, bags: c._sum.quantityBags || 0 })),
        topCounties: formattedTopCounties,
        tradedCrops: tradedCrops.map(c => ({ name: c.product, bags: c._sum.quantityBags || 0 }))
      },
      insights,
      system: {
        smsSent, smsFailed,
        smsSuccessRate: smsSent + smsFailed > 0 ? (smsSent / (smsSent + smsFailed)) * 100 : 100,
        otpRequests
      }
    });
  } catch (error) {
    console.error('[ADMIN] Analytics error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
