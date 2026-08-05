import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { message, county } = await req.json();
    if (!message || !county) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const weather = await prisma.weatherCache.findUnique({ where: { county } });
    if (!weather) return NextResponse.json({ error: 'Weather data not found' }, { status: 404 });

    const prompt = `You are a precision agriculture assistant. Based STRICTLY on this JSON weather data for ${county}: ${JSON.stringify(weather.data)}
    Answer the user's question concisely (max 2 sentences). Focus on agronomy, disease risk, or logistics.
    User Question: "${message}"`;

    let aiResponse = null;

    if (GEMINI_API_KEY) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (res.ok) {
          const data = await res.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        }
      } catch (e) {}
    }

    if (!aiResponse && NVIDIA_API_KEY) {
      try {
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: "z-ai/glm-5.2", messages: [{ role: "user", content: prompt }], max_tokens: 200 })
        });
        if (res.ok) {
          const data = await res.json();
          aiResponse = data.choices?.[0]?.message?.content;
        }
      } catch (e) {}
    }

    if (!aiResponse) return NextResponse.json({ error: 'AI unavailable. Check API keys or network.' }, { status: 503 });
    return NextResponse.json({ success: true, response: aiResponse.trim() });

  } catch (error) {
    console.error('[Weather AI] Error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
