import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const vehicles = await prisma.transportVehicle.findMany({
      where: { providerId: provider.id, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('[API] Transport vehicles error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
