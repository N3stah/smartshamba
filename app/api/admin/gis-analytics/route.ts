import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    // Fetch active listings with their farmer and county relations
    const listings = await prisma.produceListing.findMany({
      where: { status: 'ACTIVE' },
      include: {
        farmer: {
          select: { id: true, countyId: true, county: { select: { name: true } } }
        }
      }
    });

    // Aggregate supply by county manually
    const countyMap = new Map<string, { county: string; bags: number }>();

    for (const listing of listings) {
      const countyName = listing.farmer?.county?.name || 'Unknown';
      const current = countyMap.get(countyName) || { county: countyName, bags: 0 };
      current.bags += listing.quantityBags;
      countyMap.set(countyName, current);
    }

    const supplyByCounty = Array.from(countyMap.values()).map(c => ({
      county: c.county,
      bags: c.bags
    }));

    return NextResponse.json({ supplyByCounty });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
