import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const predictions = await prisma.marketPrediction.findMany({
      where: {
        region: 'National',
        crop: { in: ['Maize', 'Beans'] }
      },
      orderBy: {
        generatedAt: 'desc'
      },
      // Get the latest prediction for each crop/horizon combo
      distinct: ['crop', 'horizon']
    });

    return NextResponse.json(predictions);
  } catch (error) {
    console.error('[API] Error fetching market intelligence:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
