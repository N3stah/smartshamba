import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

async function callAIProvider(prompt: string): Promise<string | null> {
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch (e) {}
  }
  
  if (NVIDIA_API_KEY) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "z-ai/glm-5.2",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 300
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (e) { return null; }
  }
  return null;
}

export async function generateTransportRecommendation(
  bags: number, 
  pickupCounty: string, 
  dropoffCounty: string, 
  providers: any[]
) {
  try {
    // Fetch weather for pickup county to check for logistics risks
    const weatherDoc = await (prisma as any).weatherCache.findUnique({ where: { county: pickupCounty } });
    let weatherContext = 'Weather: Clear';
    if (weatherDoc && weatherDoc.data) {
      const data = weatherDoc.data as any;
      weatherContext = `Weather: ${data.current.rainProbability}% rain, ${data.current.condition}.`;
    }

    const prompt = `You are an AI logistics optimizer for SmartShamba Kenya.
    Analyze this transport request:
    - Bags to transport: ${bags}
    - Pickup: ${pickupCounty}
    - Dropoff: ${dropoffCounty}
    - ${weatherContext}
    
    Available Providers: ${JSON.stringify(providers.map(p => ({ name: p.name, vehicle: p.vehicleType, capacity: p.capacityKg, rate: p.ratePerKm })))}
    
    Select the BEST provider based on capacity (must fit the bags), cost-effectiveness, and weather suitability.
    Return a JSON object with these exact keys:
    {
      "recommended_provider": "<name of the best provider>",
      "reason": "<1 sentence explaining why this provider is best>",
      "eta_hours": <estimated hours for the trip based on distance and weather>,
      "risk_warning": "<1 sentence warning if weather poses a risk to the cargo, else 'None'>"
    }`;

    const aiResponse = await callAIProvider(prompt);
    if (!aiResponse) return null;

    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[AI Transport] Error:', error);
    Sentry.captureException(error);
    return null;
  }
}
