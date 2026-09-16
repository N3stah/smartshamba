import { getAnalyticalProvider } from '@/lib/ai/providers';

export async function generateWeatherMarketInsight(prompt: string): Promise<string | null> {
  const provider = getAnalyticalProvider();
  return provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000 });
}

export async function generateProcurementIntelligence(county: string): Promise<string | null> {
  const prompt = `Generate procurement intelligence for ${county} county. Focus on maize supply and demand trends.`;
  return generateWeatherMarketInsight(prompt);
}
