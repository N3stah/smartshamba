import { NextRequest, NextResponse } from 'next/server';
import { generateAndCachePrediction } from '@/lib/ai/prediction-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const crops = ['Maize', 'Beans'];
    const horizons = ['7d', '14d', '30d'];

    for (const crop of crops) {
      for (const horizon of horizons) {
        await generateAndCachePrediction(crop, horizon);
      }
    }

    return NextResponse.json({ success: true, message: 'AI Predictions generated.' });
  } catch (error) {
    console.error('[AI] Cron error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
