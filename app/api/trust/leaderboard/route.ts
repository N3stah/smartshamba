import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const [farmers, buyers] = await Promise.all([
      prisma.trustScore.findMany({
        where: { userType: 'FARMER', score: { gt: 0 } },
        orderBy: { score: 'desc' },
        take: 10
      }),
      prisma.trustScore.findMany({
        where: { userType: 'BUYER', score: { gt: 0 } },
        orderBy: { score: 'desc' },
        take: 10
      })
    ]);

    // Fetch names
    const farmerIds = farmers.map(f => f.userId);
    const farmerUsers = await prisma.farmer.findMany({ where: { id: { in: farmerIds } }, select: { id: true, name: true, village: true } });
    const farmerMap = new Map(farmerUsers.map(f => [f.id, { name: f.name, location: f.village }]));

    const buyerIds = buyers.map(b => b.userId);
    const buyerUsers = await prisma.buyer.findMany({ where: { id: { in: buyerIds } }, select: { id: true, name: true, location: true } });
    const buyerMap = new Map(buyerUsers.map(b => [b.id, { name: b.name, location: b.location }]));

    return NextResponse.json({
      farmers: farmers.map(f => ({ ...f, name: farmerMap.get(f.userId)?.name, location: farmerMap.get(f.userId)?.location })),
      buyers: buyers.map(b => ({ ...b, name: buyerMap.get(b.userId)?.name, location: buyerMap.get(b.userId)?.location }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
