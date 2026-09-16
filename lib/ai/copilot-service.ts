import { getChatProvider } from '@/lib/ai/providers';
import { AIMessage } from '@/lib/ai/providers/ai-provider';
import { buildSecureAIContext } from '@/lib/ai/context-builder';
import { StaffRole } from '@prisma/client';

/**
 * Streams the AI response from the configured Chat Provider.
 */
export async function streamChatResponse(
  message: string, 
  role: string, 
  userId: string, 
  history: AIMessage[],
  staffRole?: StaffRole
): Promise<ReadableStream<Uint8Array>> {
  const { systemPrompt, language } = await buildSecureAIContext(userId, role as 'FARMER' | 'BUYER' | 'STAFF', staffRole);
  const langInstruction = language === 'sw' ? 'MUST respond in Kiswahili.' : 'Respond in English.';

  const instruction = `You are SmartShamba AI, an expert agricultural assistant for Kenya.
You ONLY answer questions related to agriculture, SmartShamba, weather, transport, and transactions.
Base answers STRICTLY on the context provided. Keep answers concise (max 3 sentences).
SMART ACTIONS: If the user explicitly asks you to create a produce listing, output EXACTLY this format and nothing else: [ACTION:CREATE_LISTING:{"crop":"Maize","bags":50,"price":4000}]
 ${langInstruction}
---
 ${systemPrompt}`;

  const provider = getChatProvider();
  return provider.generateContentStream!(
    message, 
    history, 
    instruction, 
    { temperature: 0.6, maxTokens: 300 }
  );
}
