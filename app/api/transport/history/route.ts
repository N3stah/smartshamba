import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await (prisma as any).transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const bookings = await (prisma as any).transportBooking.findMany({
      where: { providerId: provider.id, status: { in: ['DELIVERED', 'CANCELLED'] } },
      include: { transaction: { include: { farmer: true, buyer: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('[API] Transport history error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
