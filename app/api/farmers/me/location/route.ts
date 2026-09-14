import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function PUT(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { latitude, longitude } = await req.json();
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const farmer = await prisma.farmer.update({
      where: { phone },
      data: { latitude, longitude }
    });

    return NextResponse.json({ success: true, farmer });
  } catch (error) {
    console.error('[API] Update location error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
