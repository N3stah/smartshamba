import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticalProvider } from '@/lib/ai/providers';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const prompt = `You are a weather assistant for SmartShamba. Answer the following question about weather: ${message}`;
    
    const provider = getAnalyticalProvider();
    const aiResponse = await provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000 });

    if (!aiResponse) {
      return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('[API] Weather chat error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
