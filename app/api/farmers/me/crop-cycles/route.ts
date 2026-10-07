import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFarmerAuth, getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  const authError = requireFarmerAuth(req);
  if (authError) return authError;
  
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    
    const cycles = await prisma.farmCropCycle.findMany({
      where: { farmerId: farmer.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { costEntries: true } } }
    });
    
    return NextResponse.json(cycles);
  } catch (error) {
    console.error('[FARM ECONOMICS] GET cycles error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireFarmerAuth(req);
  if (authError) return authError;
  
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    
    const body = await req.json();
    const { crop, season, acreage, plantingDate, expectedHarvestDate, expectedYieldBags } = body;
    
    if (!crop || !season) {
      return NextResponse.json({ error: 'Crop and season are required' }, { status: 400 });
    }
    if (acreage !== undefined && acreage < 0) {
      return NextResponse.json({ error: 'Acreage cannot be negative' }, { status: 400 });
    }
    if (expectedYieldBags !== undefined && expectedYieldBags <= 0) {
      return NextResponse.json({ error: 'Expected yield must be greater than 0' }, { status: 400 });
    }
    
    const cycle = await prisma.farmCropCycle.create({
      data: {
        farmerId: farmer.id,
        crop,
        season,
        acreage: acreage ? parseFloat(acreage) : null,
        plantingDate: plantingDate ? new Date(plantingDate) : null,
        expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : null,
        expectedYieldBags: expectedYieldBags ? parseInt(expectedYieldBags, 10) : null,
      }
    });
    
    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error('[FARM ECONOMICS] POST cycle error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
