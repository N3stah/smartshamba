import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CFO, StaffRole.CTO, StaffRole.PM]);
    if (authError) return authError;

    // Audit Log
    const staff = await getStaffSession(req);
    if (staff && staff.id !== 'legacy-admin') {
      await prisma.auditLog.create({
        data: {
          action: 'EXECUTIVE_VIEWED_BI_DASHBOARD',
          actorType: 'STAFF',
          actorId: staff.id,
          staffId: staff.id,
          entityType: 'BusinessIntelligence',
          entityId: 'metrics'
        }
      }).catch(e => console.error('[AUDIT]', e));
    }

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
    const [
      newFarmersToday, newBuyersToday, newTxToday, settledTxToday,
      completedTransportToday, failedTransportToday, activeListingsToday, activeDemandsToday,
      revenueToday, activeTransport, pendingWithdrawals, aiPredictions, weatherAlerts, activeContracts
    ] = await Promise.all([
      prisma.farmer.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.buyer.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.transaction.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.transaction.count({ where: { status: 'SETTLED', createdAt: { gte: startOfToday } } }),
      prisma.transportBooking.count({ where: { status: 'DELIVERED', createdAt: { gte: startOfToday } } }),
      prisma.transportBooking.count({ where: { status: 'CANCELLED', createdAt: { gte: startOfToday } } }),
      prisma.produceListing.count({ where: { status: 'ACTIVE', createdAt: { gte: startOfToday } } }),
      prisma.buyerDemand.count({ where: { status: 'ACTIVE', createdAt: { gte: startOfToday } } }),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, where: { status: 'SETTLED', createdAt: { gte: startOfToday } } }),
      prisma.transportBooking.count({ where: { status: { in: ['REQUESTED', 'MATCHED', 'ACCEPTED', 'LOADED', 'IN_TRANSIT'] } } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.marketPrediction.count(),
      prisma.weatherAlert.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.contract.count({ where: { status: 'EXECUTED' } })
    ]);

    // 3. Combine Snapshot + Today
    const totalFarmers = snapshot.totalFarmers + newFarmersToday;
    const totalBuyers = snapshot.totalBuyers + newBuyersToday;
    const totalTx = snapshot.totalTx + newTxToday;
    const settledTx = snapshot.settledTx + settledTxToday;
    const disputedTx = snapshot.disputedTx; // Disputes are complex, rely on snapshot for historical + live count if needed. For simplicity, we use snapshot for total disputed.
    const completedTransport = snapshot.completedTransport + completedTransportToday;
    const failedTransport = snapshot.failedTransport + failedTransportToday;
    const activeListings = snapshot.activeListings + activeListingsToday; // Note: active listings snapshot is a point-in-time count. Adding today's new active listings is an approximation.
    const activeDemands = snapshot.activeDemands + activeDemandsToday;
    const totalRevenue = snapshot.totalRevenue + (revenueToday._sum.totalValue || 0);

    const successRate = totalTx > 0 ? (settledTx / totalTx) * 100 : 0;
    const disputeRate = totalTx > 0 ? (disputedTx / totalTx) * 100 : 0;
    const transportSuccessRate = (completedTransport + failedTransport) > 0 ? (completedTransport / (completedTransport + failedTransport))* 100 : 0;

    const [totalRevenueBalance, platformLiabilities, supplyByCrop, demandByCrop] = await Promise.all([
      getWalletBalance('PLATFORM', 'PLATFORM'),
      getWalletBalance('escrow', 'ESCROW'),
      prisma.produceListing.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } }),
      prisma.buyerDemand.groupBy({ by: ['product'], where: { status: 'ACTIVE' }, _sum: { quantityBags: true } })
    ]);

    return NextResponse.json({
      ceo: {
        totalRevenue: totalRevenueBalance || 0,
        revenueGrowth: 0,
        totalFarmers, totalBuyers,
        farmerGrowth: newFarmersToday, buyerGrowth: newBuyersToday,
        aiPredictions, activeContracts
      },
      cfo: {
        successRate: parseFloat(successRate.toFixed(1)),
        disputeRate: parseFloat(disputeRate.toFixed(1)),
        activeTransport,
        transportSuccessRate: parseFloat(transportSuccessRate.toFixed(1)),
        txVolume30d: totalTx, // Simplified to total
        activeContracts,
        totalRevenue: totalRevenueBalance || 0,
        revenue30d: totalRevenue,
        platformLiabilities,
        pendingWithdrawals
      },
      growth: {
        newFarmers30d: newFarmersToday, newBuyers30d: newBuyersToday,
        activeListings, activeDemands
      },
      logistics: {
        activeJobs: activeTransport,
        completedJobs: completedTransport,
        successRate: parseFloat(transportSuccessRate.toFixed(1))
      },
      risk: {
        verifiedFarmers: 0, // Removed heavy live query, rely on snapshot if added later
        verifiedBuyers: 0,
        platinumUsers: snapshot.platinumUsers,
        suspiciousAccounts: snapshot.suspiciousAccounts,
        disputedTx
      },
      agintel: {
        weatherAlerts,
        supplyByCrop: supplyByCrop.map(c => ({ crop: c.product, bags:c._sum.quantityBags || 0 })),
        demandByCrop: demandByCrop.map(c => ({ crop: c.product, bags:c._sum.quantityBags || 0 }))
      }
    });
  } catch (error) {
    console.error('[API] Executive BI error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
