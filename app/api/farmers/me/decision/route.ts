import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFarmerAuth, getFarmerSession } from '@/lib/auth';
import { evaluatePolicy } from '@/lib/decision-engine/policy';
import { fetchForecast } from '@/lib/decision-engine/forecast-adapter';
import { calculateFarmEconomics } from '@/lib/farm-economics/calculator';
import { calculateDistance } from '@/lib/transport/transport-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  const authError = requireFarmerAuth(req);
  if (authError) return authError;

  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    // 1. Fetch the most recent active crop cycle
    const cropCycle = await prisma.farmCropCycle.findFirst({
      where: { farmerId: farmer.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { costEntries: true }
    });

    if (!cropCycle) {
      return NextResponse.json({ 
        action: 'INSUFFICIENT_EVIDENCE', 
        reason: 'NO_CROP_CYCLE',
        rationale: 'Please create a crop cycle and enter your production costs to receive a recommendation.'
      });
    }

    // 2. Fetch the most recent batch for that cycle
    const batch = await prisma.farmBatch.findFirst({
      where: { cropCycleId: cropCycle.id },
      orderBy: { producedAt: 'desc' }
    });

    if (!batch) {
      return NextResponse.json({ 
        action: 'INSUFFICIENT_EVIDENCE', 
        reason: 'NO_BATCH',
        rationale: 'Please record a harvest batch to receive a recommendation.'
      });
    }

    // 3. Fetch active buyer demands (Executable Offers)
    const demands = await prisma.buyerDemand.findMany({
      where: { status: 'ACTIVE', product: cropCycle.crop },
      include: { buyer: true }
    });

    // Map demands to ExecutableOffer interface
    const currentOffers = demands.map(d => ({
      id: d.id,
      buyerId: d.buyerId,
      commodity: d.product,
      pricePerBag: d.pricePerBag || 0,
      quantityBags: d.quantityBags,
      destinationCounty: d.location,
      validUntil: d.endDate ?? undefined
    }));

    // 4. Calculate Transport Cost (Estimate to nearest buyer market)
    let transportCostPerBag: number | null = null;
    if (farmer.countyId && currentOffers.length > 0) {
      const farmerCounty = await prisma.county.findUnique({ where: { id: farmer.countyId } });
      if (farmerCounty) {
        // Find closest demand to estimate transport
        const closestDemand = currentOffers.reduce((closest, current) => {
          const dist = calculateDistance(farmerCounty.name, current.destinationCounty);
          return dist < closest.dist ? { demand: current, dist } : closest;
        }, { demand: currentOffers[0], dist: Infinity });

        // Estimate cost: distance * rate * bag factor
        // Assuming an average rate of 50 KES/km for pilot estimation
        const estimatedCost = calculateDistance(farmerCounty.name, closestDemand.demand.destinationCounty) * 50 * (1 + (batch.quantityBags * 0.05));
        transportCostPerBag = estimatedCost / batch.quantityBags;
      }
    }

    // 5. Fetch Market Observations
    const marketObservations = await prisma.marketPriceObservation.findMany({
      where: { commodity: cropCycle.crop },
      orderBy: { observedAt: 'desc' },
      take: 10
    });

    // 6. Fetch Forecast (if service is available)
    let forecast = null;
    const fastApiUrl = process.env.PRICING_MODEL_URL || 'http://localhost:8000';
    try {
      forecast = await fetchForecast(fastApiUrl, cropCycle.crop, 'NCPB', 'National', 7);
    } catch (e) {
      console.warn('[Decision API] Forecast service unavailable');
    }

    // 7. Calculate Farm Economics
    const economics = calculateFarmEconomics(cropCycle, cropCycle.costEntries);

    // 8. Execute Decision Policy
    const decision = evaluatePolicy({
      batchId: batch.id,
      bagSizeKg: batch.bagSizeKg,
      commodity: cropCycle.crop,
      farmerCounty: farmer.countyId || 'Unknown',
      breakEvenPricePerBag: economics.breakEvenPrice,
      currentOffers,
      marketObservations: marketObservations.map(o => ({
        id: o.id,
        commodity: o.commodity,
        county: o.county,
        market: o.market,
        wholesaleKesPerKg: o.wholesaleKesPerKg,
        retailKesPerKg: o.retailKesPerKg,
        observedAt: o.observedAt
      })),
      forecast,
      transportCostPerBag
    });

    return NextResponse.json(decision);

  } catch (error) {
    console.error('[DECISION API] Error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
