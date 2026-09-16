import { prisma } from '@/lib/prisma';
import { StaffRole } from '@prisma/client';

export interface AnalyticsContext {
  totalFarmers: number;
  totalBuyers: number;
  totalTxs: number;
  settledTx: number;
  activeListings: number;
  activeDemands: number;
  activeWeatherAlerts: number;
  activeTransportHolds: number;
  aiPredictionsCount: number;
  transportSuccessRate: number;
}

export async function getStaffAnalyticsContext(staffRole: StaffRole): Promise<{ analytics: AnalyticsContext; snapshotRevenue: number }> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const latestSnapshot = await prisma.dailyMetric.findFirst({
    where: { date: { lt: startOfToday } },
    orderBy: { date: 'desc' }
  });

  const snapshot = latestSnapshot?.metrics as any || {};

  const [
    newFarmersToday, newBuyersToday, activeWeatherAlerts, 
    activeTransportHolds, aiPredictionsCount, activeListings, activeDemands
  ] = await Promise.all([
    prisma.farmer.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.buyer.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.weatherAlert.count({ where: { status: 'ACTIVE', severity: { in: ['HIGH', 'CRITICAL'] } } }),
    prisma.transportBooking.count({ where: { isHalted: true, weatherOverride: false } }),
    prisma.marketPrediction.count(),
    prisma.produceListing.count({ where: { status: 'ACTIVE' } }),
    prisma.buyerDemand.count({ where: { status: 'ACTIVE' } })
  ]);

  const totals = {
    farmers: (snapshot.totalFarmers || 0) + newFarmersToday,
    buyers: (snapshot.totalBuyers || 0) + newBuyersToday,
    txs: (snapshot.totalTx || 0),
    settledTx: (snapshot.settledTx || 0),
    transportSuccess: snapshot.completedTransport && snapshot.failedTransport 
      ? (snapshot.completedTransport / (snapshot.completedTransport + snapshot.failedTransport)) * 100 
      : 0
  };

  const analytics: AnalyticsContext = {
    totalFarmers: totals.farmers,
    totalBuyers: totals.buyers,
    totalTxs: totals.txs,
    settledTx: totals.settledTx,
    activeListings,
    activeDemands,
    activeWeatherAlerts,
    activeTransportHolds,
    aiPredictionsCount,
    transportSuccessRate: totals.transportSuccess
  };

  return { analytics, snapshotRevenue: snapshot.totalRevenue || 0 };
}
