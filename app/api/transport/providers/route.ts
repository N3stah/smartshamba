import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { generateTransportRecommendation } from '@/lib/ai/transport-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const county = searchParams.get('county');
    const bags = parseInt(searchParams.get('bags') || '0');
    const dropoff = searchParams.get('dropoff') || 'Nairobi';
    
    const where: { active: boolean; county?: { name: string } } = { active: true };
    if (county) where.county = { name: county };
    
    const providers = await prisma.transportProvider.findMany({
      where,
      include: { county: { select: { name: true } } },
      orderBy: { ratePerKm: 'asc' }
    });

    // If transaction details are provided, get AI recommendation
    let aiRecommendation = null;
    if (bags > 0 && county) {
      aiRecommendation = await generateTransportRecommendation(bags, county, dropoff, providers);
    }

    return NextResponse.json({ providers, aiRecommendation });
  } catch (error) {
    console.error('[API] Transport providers error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Admin creates a transport provider (unchanged)
export async function POST(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name, phone, vehicleType, capacityBags, ratePerKm, countyId } = body;

    if (!name || !phone || !vehicleType || !capacityBags || !ratePerKm) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const provider = await prisma.transportProvider.create({
      data: { name, phone, vehicleType, capacityBags, ratePerKm, countyId }
    });

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('[API] Create transport provider error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
