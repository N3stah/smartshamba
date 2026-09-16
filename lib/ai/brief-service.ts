import { getAnalyticalProvider } from '@/lib/ai/providers';

export async function generateAIResponse(prompt: string): Promise<string | null> {
  const provider = getAnalyticalProvider();
  return provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000 });
}

export async function generateDailyBrief(role: string, phone: string): Promise<string | null> {
  const prompt = `Generate a brief daily agricultural summary for a ${role} with phone ${phone}. Focus on market prices and weather.`;
  return generateAIResponse(prompt);
}
