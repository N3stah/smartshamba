import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const farmer = await prisma.farmer.findUnique({
      where: { id },
      select: { name: true, phone: true },
    });

    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    const aggregate = await prisma.rating.aggregate({
      where: { farmerId: id, raterType: 'BUYER' },
      _avg: { score: true },
      _count: { id: true },
    });

    console.log('[RATINGS] Fetched rating for farmer', id);
    return NextResponse.json({
      farmerName: farmer.name ?? farmer.phone,
      averageScore: aggregate._avg.score
        ? Math.round(aggregate._avg.score * 10) / 10
        : null,
      totalRatings: aggregate._count.id,
    });
  } catch (error) {
    console.error('[RATINGS] GET farmer rating error', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
