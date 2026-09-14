import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the client once
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });

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
  } catch {
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

  const systemInstruction = `You are SmartShamba AI, an expert agricultural assistant for Kenya.
You ONLY answer questions related to agriculture, SmartShamba, weather, and transactions.
Base answers STRICTLY on the context provided. Keep answers concise (max 3 sentences).
SMART ACTIONS: If the user explicitly asks you to create a produce listing, output EXACTLY this format and nothing else: [ACTION:CREATE_LISTING:{"crop":"Maize","bags":50,"price":4000}]
 ${langInstruction}
---
CONTEXT:
 ${context}`;

  // Format the history for the GenAI SDK
  // The SDK expects roles to be 'user' or 'model'
  const formattedHistory = history.map((msg) => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Append the current message
  const contents = [
    ...formattedHistory,
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 300,
      }
    });

    const encoder = new TextEncoder();

    // Create a new ReadableStream that transforms the Gemini stream
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
        } catch (error) {
          console.error('[AI Stream] Error iterating stream:', error);
          Sentry.captureException(error);
        } finally {
          controller.close();
        }
      }
    });

  } catch (error) {
    console.error('[AI Service] Initialization Error:', error);
    Sentry.captureException(error);
    throw new Error('Failed to initialize AI stream');
  }
}
