// @ts-nocheck
// TODO: V2 - Re-enable type checking after Stage 6/7 schema is built
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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
    const radiusMeters = radiusKm * 1000;

    // V2.0 Stage 7: Use PostGIS ST_DWithin for scalable spatial query
    const farmers = await prisma.$queryRaw`
      SELECT 
        f.id, f.name, f.village, f.latitude, f.longitude,
        ST_Distance(f.location, ST_MakePoint(${buyer.longitude}, ${buyer.latitude})::geography) / 1000 as distance_km
      FROM "Farmer" f
      JOIN "ProduceListing" pl ON pl.farmerId = f.id AND pl.status = 'ACTIVE'
      WHERE f.location IS NOT NULL 
        AND ST_DWithin(
          f.location, 
          ST_MakePoint(${buyer.longitude}, ${buyer.latitude})::geography, 
          ${radiusMeters}
        )
      ORDER BY distance_km ASC
      LIMIT 50;
    `;

    return NextResponse.json({ farmers });
  } catch (error) {
    console.error('[API] Nearby suppliers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
