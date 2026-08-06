import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

/**
 * Fetches deep context and language preference for the AI.
 */
async function getContext(role: string, phone: string): Promise<{ context: string, language: string }> {
  try {
    const predictions = await prisma.marketPrediction.findMany({
      where: { region: 'National', horizon: '7d' }, take: 2
    });

    let userDetails = "";
    let language = "en"; // Default to English

    if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({
        where: { phone },
        include: { ProduceListing: { where: { status: 'ACTIVE' }, take: 3 }, transactions: { where: { status: 'PENDING' }, take: 3 } }
      });
      language = farmer?.language || 'en';
      userDetails = `Active Listings: ${farmer?.ProduceListing.length || 0}. Pending Txs: ${farmer?.transactions.length || 0}.`;
    } else if (role === 'BUYER') {
      const buyer = await prisma.buyer.findFirst({
        where: { phone },
        include: { BuyerDemand: { where: { status: 'ACTIVE' }, take: 3 }, transactions: { where: { status: 'PENDING' }, take: 3 } }
      });
      language = buyer?.language || 'en';
      userDetails = `Active Demands: ${buyer?.BuyerDemand.length || 0}. Pending Txs: ${buyer?.transactions.length || 0}.`;
    } else {
      const stats = await Promise.all([prisma.farmer.count(), prisma.buyer.count(), prisma.transaction.count()]);
      userDetails = `Admin Stats: ${stats[0]} Farmers, ${stats[1]} Buyers, ${stats[2]} Txs.`;
    }

    const marketContext = predictions.map(p => `${p.crop}: KSh ${p.predictedPrice} (${p.recommendation})`).join(', ');
    return { 
      context: `User Details: ${userDetails}\nMarket Context: ${marketContext}`, 
      language 
    };
  } catch (e) {
    return { context: "Context unavailable.", language: "en" };
  }
}

/**
 * Streams the AI response from Gemini.
 */
export async function streamChatResponse(
  message: string, 
  role: string, 
  phone: string, 
  history: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const { context, language } = await getContext(role, phone);
  const langInstruction = language === 'sw' ? 'MUST respond in Kiswahili.' : 'Respond in English.';

  const systemPrompt = `SYSTEM INSTRUCTIONS: You are SmartShamba AI, an expert agricultural assistant for Kenya.
  You ONLY answer questions related to agriculture, SmartShamba, weather, and transactions.
  Base answers STRICTLY on the context provided. Keep answers concise (max 3 sentences).
  SMART ACTIONS: If the user explicitly asks you to create a produce listing, output EXACTLY this format and nothing else: [ACTION:CREATE_LISTING:{"crop":"Maize","bags":50,"price":4000}]
  ${langInstruction}
  ---
  CONTEXT:
  ${context}
  ---
  CONVERSATION HISTORY:
  ${history.map(h => `${h.role}: ${h.content}`).join('\n')}
  ---
  USER QUESTION: ${message}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key=${GEMINI_API_KEY}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 300 }
    })
  });

  if (!res.ok || !res.body) {
    throw new Error('Gemini streaming failed');
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          try {
            const parts = buffer.match(/\{"text":\s*"[^"]*"\}/g);
            if (parts) {
              for (const part of parts) {
                const json = JSON.parse(part);
                if (json.text) {
                  controller.enqueue(encoder.encode(json.text));
                }
              }
              buffer = buffer.substring(parts[parts.length - 1].length);
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      } catch (error) {
        console.error('[AI Stream] Error:', error);
        Sentry.captureException(error);
      } finally {
        controller.close();
      }
    }
  });

  return stream;
}
