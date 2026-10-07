import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFarmerAuth, getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';
import { calculateFarmEconomics } from '@/lib/farm-economics/calculator';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireFarmerAuth(req);
  if (authError) return authError;
  
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    
    const { id } = await params;
    const cycle = await prisma.farmCropCycle.findUnique({ where: { id } });
    if (!cycle || cycle.farmerId !== farmer.id) {
      return NextResponse.json({ error: 'Crop cycle not found' }, { status: 404 });
    }
    
    const costEntries = await prisma.farmCostEntry.findMany({
      where: { cropCycleId: id }
    });
    
    const economics = calculateFarmEconomics(cycle, costEntries);
    
    return NextResponse.json({
      cropCycle: cycle,
      costEntries,
      ...economics
    });
  } catch (error) {
    console.error('[FARM ECONOMICS] GET economics error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
