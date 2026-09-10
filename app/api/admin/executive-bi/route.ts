import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Group all counts into a single transaction to use only 1 DB connection
    const [
      totalFarmers, newFarmers30d, totalBuyers, newBuyers30d,
      totalTx, tx30d, settledTx, disputedTx,
      activeContracts, activeTransport, aiPredictions, weatherAlerts,
      completedTransport, failedTransport, pendingWithdrawals, activeListings, activeDemands,
      verifiedFarmers, verifiedBuyers, platinumUsers, suspiciousAccounts
    ] = await prisma.$transaction([
      prisma.farmer.count(),
      prisma.farmer.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.buyer.count(),
      prisma.buyer.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.transaction.count({ where: { status: 'SETTLED' } }),
      prisma.transaction.count({ where: { status: 'DISPUTED' } }),
      prisma.contract.count({ where: { status: 'EXECUTED' } }),
      prisma.transportBooking.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'LOADED', 'IN_TRANSIT'] } } }),
      prisma.marketPrediction.count(),
      prisma.weatherAlert.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.transportBooking.count({ where: { status: 'DELIVERED' } }),
      prisma.transportBooking.count({ where: { status: 'CANCELLED' } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.produceListing.count({ where: { status: 'ACTIVE' } }),
      prisma.buyerDemand.count({ where: { status: 'ACTIVE' } }),
      prisma.farmer.count({ where: { verified: true } }),
      prisma.buyer.count({ where: { verified: true } }),
      prisma.trustScore.count({ where: { level: 'PLATINUM' } }),
      prisma.trustScore.count({ where: { score: { lt: 40 } } })
    ]);

    // Fetch wallet balances and groupBys in parallel (safe, only 3 connections)
    const [totalRevenueBalance, platformLiabilities, supplyByCrop, demandByCrop] = await Promise.all([
      getWalletBalance('PLATFORM', 'PLATFORM'),
      getWalletBalance('escrow', 'ESCROW'),
      prisma.produceListing.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } }),
      prisma.buyerDemand.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } })
    ]);

    const successRate = totalTx > 0 ? (settledTx / totalTx) * 100 : 0;
    const disputeRate = totalTx > 0 ? (disputedTx / totalTx) * 100 : 0;
    const transportSuccessRate = (completedTransport + failedTransport) > 0 ? (completedTransport / (completedTransport + failedTransport)) * 100 : 0;

    return NextResponse.json({
      // 1. CEO View
      ceo: {
        totalRevenue: totalRevenueBalance || 0,
        revenueGrowth: 0, // Simplified to prevent divide-by-zero errors on empty DB
        totalFarmers, totalBuyers,
        farmerGrowth: newFarmers30d, buyerGrowth: newBuyers30d,
        aiPredictions, activeContracts
      },
      // 2. COO View
      coo: {
        successRate: parseFloat(successRate.toFixed(1)),
        disputeRate: parseFloat(disputeRate.toFixed(1)),
        activeTransport,
        transportSuccessRate: parseFloat(transportSuccessRate.toFixed(1)),
        txVolume30d: tx30d,
        activeContracts
      },
      // 3. CFO View
      cfo: {
        totalRevenue: totalRevenueBalance || 0,
        revenue30d: 0,
        platformLiabilities,
        pendingWithdrawals
      },
      // 4. Growth View
      growth: {
        newFarmers30d, newBuyers30d,
        activeListings, activeDemands
      },
      // 5. Logistics View
      logistics: {
        activeJobs: activeTransport,
        completedJobs: completedTransport,
        successRate: parseFloat(transportSuccessRate.toFixed(1))
      },
      // 6. Trust & Risk View
      risk: {
        verifiedFarmers, verifiedBuyers,
        platinumUsers, suspiciousAccounts,
        disputedTx
      },
      // 7. AgIntel View
      agintel: {
        weatherAlerts,
        supplyByCrop: supplyByCrop.map(c => ({ crop: c.product, bags: c._sum.quantityBags || 0 })),
        demandByCrop: demandByCrop.map(c => ({ crop: c.product, bags: c._sum.quantityBags || 0 }))
      }
    });
  } catch (error) {
    console.error('[API] Executive BI error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
