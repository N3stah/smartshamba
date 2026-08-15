import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

async function callEnsemble(prompt: string): Promise<string | null> {
  try {
    // Use Gemini for weather advisory synthesis
    if (GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 400 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    }
    // Fallback to NVIDIA if Gemini fails
    if (NVIDIA_API_KEY) {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 400
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    }
    return null;
  } catch (e) {
    console.error('[AI Advisory] Ensemble call failed:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { temperature, precipitation, windSpeed, humidity, description, county } = await req.json();

    const prompt = `SYSTEM: You are the Precision Agronomy AI for SmartShamba Kenya. 
    Analyze the following hyper-local climate data (downscaled using NVIDIA Earth-2 models) and provide a concise, actionable agricultural advisory for farmers in ${county}.
    Keep it under 3 sentences. Focus on immediate actions (e.g., harvest timing, drainage, pest risk, windbreaks).
    
    Climate Data:
    - Temp: ${temperature}°C
    - Rainfall: ${precipitation}mm
    - Wind: ${windSpeed}km/h
    - Humidity: ${humidity}%
    - Condition: ${description}`;

    const advisory = await callEnsemble(prompt);
    
    if (!advisory) {
      return NextResponse.json({ advisory: "Agronomy AI advisory temporarily unavailable. Please monitor fields manually." }, { status: 200 });
    }

    return NextResponse.json({ advisory });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
