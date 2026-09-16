import { prisma } from '@/lib/prisma';
import type { AIRecommendation } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import { getAnalyticalProvider } from '@/lib/ai/providers';

interface PredictionResult {
  predictedPrice: number;
  confidenceScore: number;
  recommendation: string;
  explanation: string;
}

async function collectMarketData(crop: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SETTLED', createdAt: { gte: thirtyDaysAgo } },
    select: { pricePerBag: true, quantityBags: true, createdAt: true }
  });
  const activeListings = await prisma.produceListing.count({ where: { status: 'ACTIVE', product: crop }});
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

  try {
    const provider = getAnalyticalProvider();
    const aiResponse = await provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000, jsonMode: true });
    
    if (!aiResponse) {
      console.log(`[AI] No response from provider for ${crop}.`);
      return;
    }

    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: PredictionResult = JSON.parse(cleanJson);

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
        crop, region: 'National', horizon,
        currentPrice: currentAvgPrice,
        predictedPrice: parsed.predictedPrice,
        confidenceScore: parsed.confidenceScore,
        recommendation: recommendation as AIRecommendation,
        explanation: parsed.explanation
      }
    });
    console.log(`[AI] Successfully cached prediction for ${crop} (${horizon})`);
  } catch (error) {
    console.error(`[AI] Failed to parse AI response for ${crop}:`, error);
    Sentry.captureException(error);
  }
}
