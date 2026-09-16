import { getAnalyticalProvider } from '@/lib/ai/providers';

export async function generateAIResponse(prompt: string): Promise<string | null> {
  const provider = getAnalyticalProvider();
  return provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000 });
}

export async function generateNvidiaResponse(prompt: string): Promise<string | null> {
  return generateAIResponse(prompt);
}
