import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const [topFarmers, topBuyers, topProviders, lowScoreUsers] = await Promise.all([
      prisma.trustScore.findMany({
        where: { userType: 'FARMER', score: { gte: 75 } },
        orderBy: { score: 'desc' },
        take: 10,
        include: { 
          // We can't directly include Farmer due to polymorphic relation, 
          // but we can fetch names separately if needed
        }
      }),
      prisma.trustScore.findMany({
        where: { userType: 'BUYER', score: { gte: 75 } },
        orderBy: { score: 'desc' },
        take: 10
      }),
      prisma.trustScore.findMany({
        where: { userType: 'TRANSPORT', score: { gte: 75 } },
        orderBy: { score: 'desc' },
        take: 10
      }),
      prisma.trustScore.findMany({
        where: { score: { lt: 40 } },
        orderBy: { score: 'asc' },
        take: 10
      })
    ]);

    // Fetch names for top farmers
    const farmerIds = topFarmers.map(t => t.userId);
    const farmers = await prisma.farmer.findMany({
      where: { id: { in: farmerIds } },
      select: { id: true, name: true }
    });
    const farmerMap = new Map(farmers.map(f => [f.id, f.name]));

    const buyerIds = topBuyers.map(t => t.userId);
    const buyers = await prisma.buyer.findMany({
      where: { id: { in: buyerIds } },
      select: { id: true, name: true }
    });
    const buyerMap = new Map(buyers.map(b => [b.id, b.name]));

    return NextResponse.json({
      topFarmers: topFarmers.map(t => ({ ...t, name: farmerMap.get(t.userId) || 'Unknown' })),
      topBuyers: topBuyers.map(t => ({ ...t, name: buyerMap.get(t.userId) || 'Unknown' })),
      topProviders: topProviders, // Names not critical for MVP
      suspiciousAccounts: lowScoreUsers
    });
  } catch (error) {
    console.error('[API] Admin reputation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
