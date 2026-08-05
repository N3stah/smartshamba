import { NextRequest, NextResponse } from 'next/server';
import { generateProcurementIntelligence } from '@/lib/ai/weather-market-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const county = searchParams.get('county') || 'Trans Nzoia';

    const intelligence = await generateProcurementIntelligence(county);
    
    if (!intelligence) {
      return NextResponse.json({ error: 'Intelligence unavailable. Check API keys.' }, { status: 503 });
    }

    return NextResponse.json({ success: true, intelligence });
  } catch (error) {
    console.error('[API] Procurement Intelligence error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
