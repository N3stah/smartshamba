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
          max_tokens: 500
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

/**
 * Generates integrated Weather + Market intelligence for Buyers.
 * Combines weather data with market predictions to give procurement recommendations.
 */
export async function generateProcurementIntelligence(county: string) {
  try {
    // 1. Fetch Weather Data
    const weatherDoc = await prisma.weatherCache.findUnique({ where: { county } });
    if (!weatherDoc || !weatherDoc.data) return null;
    const weather = weatherDoc as any;
    if (!weather) return null;

    // 2. Fetch Market Predictions
    const predictions = await prisma.marketPrediction.findMany({
      where: { region: 'National' },
      orderBy: { generatedAt: 'desc' },
      distinct: ['crop', 'horizon'],
      take: 6
    });

    // 3. Fetch Active Supply (Listings)
    const activeListings = await prisma.produceListing.count({
      where: { status: 'ACTIVE' }
    });

    // 4. Fetch Active Demand
    const activeDemands = await prisma.buyerDemand.count({
      where: { status: 'ACTIVE' }
    });

    const marketContext = predictions.map(p => 
      `${p.crop} ${p.horizon}: KSh ${p.predictedPrice} (Rec: ${p.recommendation})`
    ).join('; ');

    const weatherContext = `Temp: ${weather.data.current.temp}°C, Rain: ${weather.data.current.rainProbability}%, Humidity: ${weather.data.current.humidity}%, Wind: ${weather.data.current.windSpeed}km/h`;

    // 5. AI Integration Prompt
    const prompt = `You are an expert agricultural supply chain analyst in Kenya.
    Analyze the following integrated data for ${county} County:
    
    WEATHER: ${weatherContext}
    WEATHER ADVISORY: ${weather.advisory}
    MARKET PREDICTIONS: ${marketContext}
    ACTIVE SUPPLY (Listings): ${activeListings}
    ACTIVE DEMAND: ${activeDemands}
    
    Generate a JSON response with these exact keys:
    {
      "supply_impact": "1 sentence prediction on how weather will affect maize/bean supply (e.g., 'Heavy rain will delay harvesting, reducing supply by ~15%')",
      "price_impact": "1 sentence prediction on price movement (e.g., 'Prices expected to rise 5-10% due to supply disruption')",
      "procurement_rec": "1 sentence actionable recommendation for buyers (e.g., 'Purchase within 3 days before supply drops')",
      "risk_level": "Low/Medium/High",
      "urgency": "Immediate/Within 3 days/Within 1 week/No rush"
    }`;

    const aiResponse = await callAIProvider(prompt);
    if (!aiResponse) return null;

    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[Weather-Market AI] Error:', error);
    Sentry.captureException(error);
    return null;
  }
}
