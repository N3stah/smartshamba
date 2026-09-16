import { prisma } from '@/lib/prisma';

export interface MarketContext {
  listings: { product: string; quantityBags: number; pricePerBag: number }[];
  demands: { product: string; quantityBags: number }[];
  predictions: { crop: string; predictedPrice: number; recommendation: string }[];
}

export async function getFarmerMarketContext(farmerId: string): Promise<MarketContext> {
  const [listings, predictions] = await Promise.all([
    prisma.produceListing.findMany({ where: { farmerId, status: 'ACTIVE' }, take: 3, select: { product: true, quantityBags: true, pricePerBag: true } }),
    prisma.marketPrediction.findMany({ where: { region: 'National', horizon: '7d' }, take: 2, select: { crop: true, predictedPrice: true, recommendation: true } })
  ]);
  return { listings, demands: [], predictions };
}

export async function getBuyerMarketContext(buyerId: string): Promise<MarketContext> {
  const [demands, predictions] = await Promise.all([
    prisma.buyerDemand.findMany({ where: { buyerId, status: 'ACTIVE' }, take: 3, select: { product: true, quantityBags: true } }),
    prisma.marketPrediction.findMany({ where: { region: 'National', horizon: '7d' }, take: 2, select: { crop: true, predictedPrice: true, recommendation: true } })
  ]);
  return { listings: [], demands, predictions };
}
