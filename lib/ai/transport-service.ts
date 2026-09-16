import { getAnalyticalProvider } from '@/lib/ai/providers';

export async function generateTransportInsight(prompt: string): Promise<string | null> {
  const provider = getAnalyticalProvider();
  return provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000 });
}

export async function generateTransportRecommendation(
  bags: number,
  pickup: string,
  dropoff: string,
  providers: any[]
): Promise<string | null> {
  const prompt = `Recommend the best transport provider for moving ${bags} bags from ${pickup} to ${dropoff}. Available providers: ${JSON.stringify(providers)}.`;
  return generateTransportInsight(prompt);
}
