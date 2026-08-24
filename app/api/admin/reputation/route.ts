import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req);
    
    const topFarmers = await prisma.trustScore.findMany({
      where: { userType: 'FARMER' },
      orderBy: { score: 'desc' },
      take: 10
    });

    const topBuyers = await prisma.trustScore.findMany({
      where: { userType: 'BUYER' },
      orderBy: { score: 'desc' },
      take: 10
    });

    const farmerIds = topFarmers.map(t => t.userId);
    const buyerIds = topBuyers.map(t => t.userId);

    const farmers = await prisma.farmer.findMany({
      where: { id: { in: farmerIds } },
      select: { id: true, name: true, location: true }
    });

    const buyers = await prisma.buyer.findMany({
      where: { id: { in: buyerIds } },
      select: { id: true, name: true, location: true }
    });

    const farmerMap = new Map(farmers.map(f => [f.id, f]));
    const buyerMap = new Map(buyers.map(b => [b.id, b]));

    return NextResponse.json({
      topFarmers: topFarmers.map(t => ({ ...t, name: farmerMap.get(t.userId)?.name || 'Unknown', location: farmerMap.get(t.userId)?.location })),
      topBuyers: topBuyers.map(t => ({ ...t, name: buyerMap.get(t.userId)?.name || 'Unknown', location: buyerMap.get(t.userId)?.location }))
    });
  } catch (error) {
    console.error('[API] Admin reputation error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
