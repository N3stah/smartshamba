import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticalProvider } from '@/lib/ai/providers';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { county, condition } = await req.json();
    if (!county || !condition) return NextResponse.json({ error: 'County and condition are required' }, { status: 400 });

    const prompt = `Generate a brief agricultural advisory for farmers in ${county} given the current weather condition: ${condition}.`;
    
    const provider = getAnalyticalProvider();
    const aiResponse = await provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000 });

    if (!aiResponse) {
      return NextResponse.json({ error: 'Failed to generate advisory' }, { status: 500 });
    }

    return NextResponse.json({ advisory: aiResponse });
  } catch (error) {
    console.error('[API] Weather advisory error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
