import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';
import { calculateDistance } from '@/lib/transport/transport-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getBuyerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({ where: { phone } });
    if (!buyer || !buyer.latitude || !buyer.longitude) {
      return NextResponse.json({ error: 'Buyer location not set' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const radiusKm = parseInt(searchParams.get('radius') || '50');

    // Fetch active farmers with coordinates
    const farmers = await prisma.farmer.findMany({
      where: { 
        latitude: { not: null }, 
        longitude: { not: null },
        ProduceListing: { some: { status: 'ACTIVE' } }
      },
      select: { id: true, name: true, village: true, latitude: true, longitude: true }
    });

    // Filter by radius using Haversine
    const nearbyFarmers = farmers
      .map(f => {
        const distance = calculateDistance(
          `${f.latitude},${f.longitude}`, 
          `${buyer.latitude},${buyer.longitude}`
        );
        return { ...f, distance_km: distance };
      })
      .filter(f => f.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 50);

    return NextResponse.json({ farmers: nearbyFarmers });
  } catch (error) {
    console.error('[API] Nearby suppliers error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
