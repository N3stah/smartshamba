import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { generateTransportRecommendation } from '@/lib/ai/transport-service';
import * as Sentry from '@sentry/nextjs';
import { assignSmartShambaId } from '@/lib/smartshamba-id';
import { sendNotification } from '@/lib/notifications';

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

    let aiRecommendation = null;
    if (bags > 0 && county) {
      aiRecommendation = await generateTransportRecommendation(bags, county, dropoff, providers.map(p => ({ ...p, vehicleType: 'Unknown', capacityBags: 0 })));
    }

    return NextResponse.json({ providers, aiRecommendation });
  } catch (error) {
    console.error('[API] Transport providers error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;

    const body = await req.json();
    const { name, phone, vehicleType, capacityBags, ratePerKm, countyId } = body;

    if (!name || !phone || !vehicleType || !capacityBags || !ratePerKm || !countyId) {
      return NextResponse.json({ error: 'Missing required fields including countyId' }, { status: 400 });
    }

    const county = await prisma.county.findUnique({ where: { id: countyId } });
    if (!county) {
      return NextResponse.json({ error: 'Invalid countyId' }, { status: 400 });
    }

    const { provider, smartshambaId } = await prisma.$transaction(async (tx) => {
      const provider = await tx.transportProvider.create({
        data: { name, phone, ratePerKm, countyId }
      });
      const sid = await assignSmartShambaId('TRANSPORT', provider.id, county.code, tx);
      return { provider, smartshambaId: sid };
    });

    await sendNotification({
      type: 'TRANSACTION_CONFIRMATION',
      recipientPhone: provider.phone,
      body: `SmartShamba: Registration successful. Your ID is ${smartshambaId}.`
    }).catch(e => console.error('[API] Transport SMS failed:', e));

    return NextResponse.json({ success: true, provider, smartshambaId });
  } catch (error) {
    console.error('[API] Create transport provider error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
