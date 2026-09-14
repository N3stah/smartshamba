import { prisma } from '@/lib/prisma';
import type { AIRecommendation } from '@prisma/client';
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
    },
    select: { pricePerBag: true, quantityBags: true, createdAt: true }
  });

  const activeListings = await prisma.produceListing.count({ where: { status: 'ACTIVE', product: crop } });
  const activeDemands = await prisma.buyerDemand.count({ where: { status: 'ACTIVE', product: crop } });

  const dailyData = transactions.reduce((acc: Record<string, { date: string; totalValue: number; totalBags: number }>, tx) => {
    const date = new Date(tx.createdAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { date, totalValue: 0, totalBags: 0 };
    acc[date].totalValue += tx.pricePerBag * tx.quantityBags;
    acc[date].totalBags += tx.quantityBags;
    return acc;
  }, {});

  const historicalSummary = Object.values(dailyData).map((d: { date: string; totalValue: number; totalBags: number }) => ({
    date: d.date,
    avgPrice: d.totalBags > 0 ? Math.round(d.totalValue / d.totalBags) : 0,
    volume: d.totalBags
  }));

  const currentAvgPrice = historicalSummary.length > 0 
    ? historicalSummary[historicalSummary.length - 1].avgPrice 
    : 4000; 

  return { historicalSummary, currentAvgPrice, activeListings, activeDemands };
}

async function callAIProvider(prompt: string): Promise<string | null> {
  try {
    if (NVIDIA_API_KEY) {
      console.log('[AI] Calling NVIDIA (GPT-OSS-20B) for prediction...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || null;
      console.log('[AI] Raw NVIDIA response:', content);
      return content;
    } 
    return null;
  } catch (error) {
    console.error('[AI] NVIDIA prediction request failed:', error);
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
  console.log('[AI] Parsed response:', aiResponse);
  if (!aiResponse) return;

  try {
    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: PredictionResult = JSON.parse(cleanJson);

    // Uppercase and validate recommendation against enum
    const rec = (parsed.recommendation || 'WAIT').toUpperCase();
    const validRecs = ['SELL', 'WAIT', 'BUY', 'HOLD'];
    const recommendation = validRecs.includes(rec) ? rec : 'WAIT';

    await prisma.marketPrediction.upsert({
      where: { crop_region_horizon: { crop, region: 'National', horizon } },
      update: {
        currentPrice: currentAvgPrice,
        predictedPrice: parsed.predictedPrice,
        confidenceScore: parsed.confidenceScore,
        recommendation: recommendation as AIRecommendation,
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
        recommendation: recommendation as AIRecommendation,
        explanation: parsed.explanation
      }
    });
    console.log(`[AI] Successfully cached prediction for ${crop} (${horizon})`);
  } catch (error) {
    console.error(`[AI] Failed to parse AI response for ${crop}:`, aiResponse);
    Sentry.captureException(error);
  }
}
