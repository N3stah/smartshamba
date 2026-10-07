import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFarmerAuth, getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';
import { FarmCostCategory } from '@prisma/client';

const validCategories = Object.values(FarmCostCategory);

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
    
    const costs = await prisma.farmCostEntry.findMany({
      where: { cropCycleId: id },
      orderBy: { date: 'desc' }
    });
    
    return NextResponse.json(costs);
  } catch (error) {
    console.error('[FARM ECONOMICS] GET costs error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    const body = await req.json();
    const { category, amountKes, quantity, unit, date, description } = body;
    
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid cost category' }, { status: 400 });
    }
    if (!amountKes || amountKes <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    if (quantity !== undefined && quantity < 0) {
      return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 });
    }
    
    const cost = await prisma.farmCostEntry.create({
      data: {
        cropCycleId: id,
        category,
        amountKes: parseFloat(amountKes),
        quantity: quantity ? parseFloat(quantity) : null,
        unit: unit || null,
        date: date ? new Date(date) : new Date(),
        description: description || null,
      }
    });
    
    return NextResponse.json(cost, { status: 201 });
  } catch (error) {
    console.error('[FARM ECONOMICS] POST cost error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
