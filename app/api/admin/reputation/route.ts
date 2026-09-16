import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    // Allow all staff roles to view reputation data
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;
    
    const [topFarmers, topBuyers, suspiciousFarmers, suspiciousBuyers] = await Promise.all([
      prisma.trustScore.findMany({
        where: { userType: 'FARMER', score: { gte: 40 } },
        orderBy: { score: 'desc' },
        take: 10
      }),
      prisma.trustScore.findMany({
        where: { userType: 'BUYER', score: { gte: 40 } },
        orderBy: { score: 'desc' },
        take: 10
      }),
      prisma.trustScore.findMany({
        where: { userType: 'FARMER', score: { lt: 40 } },
        orderBy: { score: 'asc' },
        take: 20
      }),
      prisma.trustScore.findMany({
        where: { userType: 'BUYER', score: { lt: 40 } },
        orderBy: { score: 'asc' },
        take: 20
      })
    ]);

    const farmerIds = [...new Set([...topFarmers, ...suspiciousFarmers].map(t => t.userId))];
    const buyerIds = [...new Set([...topBuyers, ...suspiciousBuyers].map(t => t.userId))];

    const [farmers, buyers] = await Promise.all([
      prisma.farmer.findMany({
        where: { id: { in: farmerIds } },
        select: { id: true, name: true, location: true, isFrozen: true }
      }),
      prisma.buyer.findMany({
        where: { id: { in: buyerIds } },
        select: { id: true, name: true, location: true, isFrozen: true }
      })
    ]);

    const farmerMap = new Map(farmers.map(f => [f.id, f]));
    const buyerMap = new Map(buyers.map(b => [b.id, b]));

    const mapData = (trustScores: any[], map: Map<string, any>, userType: string) => 
      trustScores.map(t => ({
        ...t,
        name: map.get(t.userId)?.name || 'Unknown',
        location: map.get(t.userId)?.location || 'N/A',
        isFrozen: map.get(t.userId)?.isFrozen || false,
        userType
      }));

    return NextResponse.json({
      topFarmers: mapData(topFarmers, farmerMap, 'FARMER'),
      topBuyers: mapData(topBuyers, buyerMap, 'BUYER'),
      suspiciousAccounts: [
        ...mapData(suspiciousFarmers, farmerMap, 'FARMER'),
        ...mapData(suspiciousBuyers, buyerMap, 'BUYER')
      ]
    });
  } catch (error) {
    console.error('[API] Admin reputation error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
