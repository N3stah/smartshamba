import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface PredictionResult {
  predictedPrice: number;
  confidenceScore: number;
  recommendation: string;
  explanation: string;
}

/**
 * Collects historical marketplace data to feed to the AI.
 */
async function collectMarketData(crop: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SETTLED',
      createdAt: { gte: thirtyDaysAgo },
      // In a real scenario, you'd filter by crop via a relation. 
      // For now, we aggregate all recent settled transactions.
    },
    select: { pricePerBag: true, quantityBags: true, createdAt: true }
  });

  const activeListings = await prisma.produceListing.count({ where: { status: 'ACTIVE', product: crop } });
  const activeDemands = await prisma.buyerDemand.count({ where: { status: 'ACTIVE', product: crop } });

  // Aggregate daily averages
  const dailyData = transactions.reduce((acc: any, tx) => {
    const date = new Date(tx.createdAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { date, totalValue: 0, totalBags: 0 };
    acc[date].totalValue += tx.pricePerBag * tx.quantityBags;
    acc[date].totalBags += tx.quantityBags;
    return acc;
  }, {});

  const historicalSummary = Object.values(dailyData).map((d: any) => ({
    date: d.date,
    avgPrice: d.totalBags > 0 ? Math.round(d.totalValue / d.totalBags) : 0,
    volume: d.totalBags
  }));

  const currentAvgPrice = historicalSummary.length > 0 
    ? historicalSummary[historicalSummary.length - 1].avgPrice 
    : 4000; // Fallback baseline

  return { historicalSummary, currentAvgPrice, activeListings, activeDemands };
}

/**
 * Calls the configured AI provider (Gemini or NVIDIA) to get a structured prediction.
 */
async function callAIProvider(prompt: string): Promise<string | null> {
  try {
    if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } 
    else if (AI_PROVIDER === 'nvidia' && NVIDIA_API_KEY) {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "z-ai/glm-5.2", // Using GLM-5.2 as provided
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }
    return null;
  } catch (error) {
    console.error(`[AI] ${AI_PROVIDER} request failed:`, error);
    Sentry.captureException(error);
    return null;
  }
}

export async function generateAndCachePrediction(crop: string, horizon: string) {
  console.log(`[AI] Generating prediction for ${crop} (${horizon})...`);
  
  const { historicalSummary, currentAvgPrice, activeListings, activeDemands } = await collectMarketData(crop);

  const prompt = `You are an expert agricultural market analyst in Kenya.
  Analyze the following historical transaction data for ${crop}:
  ${JSON.stringify(historicalSummary)}
  
  Current active supply (listings): ${activeListings}
  Current active demand (buyer demands): ${activeDemands}
  Current average price per 90kg bag: KSh ${currentAvgPrice}

  Based on this data, typical seasonal trends in Kenya, and current market dynamics, predict the price for the next ${horizon}.
  Return your response STRICTLY as a JSON object with this exact structure:
  {
    "predictedPrice": <number>,
    "confidenceScore": <integer 0-100>,
    "recommendation": "<string: SELL, WAIT, or BUY>",
    "explanation": "<string: 1-2 sentence natural language explanation>"
  }`;

  const aiResponse = await callAIProvider(prompt);
  if (!aiResponse) return;

  try {
    // Clean up potential markdown formatting
    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: PredictionResult = JSON.parse(cleanJson);

    await prisma.marketPrediction.upsert({
      where: { crop_region_horizon: { crop, region: 'National', horizon } },
      update: {
        currentPrice: currentAvgPrice,
        predictedPrice: parsed.predictedPrice,
        confidenceScore: parsed.confidenceScore,
        recommendation: parsed.recommendation,
        explanation: parsed.explanation,
        generatedAt: new Date()
      },
      create: {
        crop,
        region: 'National',
        horizon,
        currentPrice: currentAvgPrice,
        predictedPrice: parsed.predictedPrice,
        confidenceScore: parsed.confidenceScore,
        recommendation: parsed.recommendation,
        explanation: parsed.explanation
      }
    });
    console.log(`[AI] Successfully cached prediction for ${crop} (${horizon})`);
  } catch (error) {
    console.error(`[AI] Failed to parse AI response for ${crop}:`, aiResponse);
  }
}
