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

    // Fetch stats
    const [totalDeliveries, activeDeliveries, totalEarnings, completedBookings] = await Promise.all([
      (prisma as any).transportBooking.count({ where: { providerId: provider.id } }),
      (prisma as any).transportBooking.count({ where: { providerId: provider.id, status: { in: ['PENDING', 'ACCEPTED', 'LOADED', 'IN_TRANSIT'] } } }),
      (prisma as any).transportBooking.aggregate({ _sum: { cost: true }, where: { providerId: provider.id, status: 'DELIVERED' } }),
      (prisma as any).transportBooking.count({ where: { providerId: provider.id, status: 'DELIVERED' } })
    ]);

    return NextResponse.json({
      provider,
      stats: {
        totalDeliveries,
        activeDeliveries,
        completedDeliveries: completedBookings,
        totalEarnings: totalEarnings._sum.cost || 0
      }
    });
  } catch (error) {
    console.error('[API] Transport profile error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
