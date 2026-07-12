import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buyer = await prisma.buyer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ratings: {
          where: { raterType: 'FARMER' },
          select: { score: true },
        },
      },
    });
    if (!buyer) {
      console.error('[RATINGS] Buyer not found', id);
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    const totalRatings = buyer.ratings.length;
    const averageScore =
      totalRatings === 0
        ? null
        : buyer.ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings;

    console.log('[RATINGS] Fetched rating summary for buyer', id);
    return NextResponse.json({
      buyerId: buyer.id,
      buyerName: buyer.name,
      averageScore,
      totalRatings,
    });
  } catch (error) {
    console.error('[RATINGS] GET buyer rating error', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
