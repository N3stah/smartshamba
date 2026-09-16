import { GoogleGenAI } from '@google/genai';
import * as Sentry from '@sentry/nextjs';
import { AIProvider, AIMessage, GenerateOptions, StreamOptions } from './ai-provider';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async generateResponse(prompt: string, options?: GenerateOptions): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1024,
          responseMimeType: options?.jsonMode ? "application/json" : "text/plain",
        }
      });
      return response.text || null;
    } catch (error) {
      console.error('[AI_PROVIDER] Gemini generateResponse error:', error);
      Sentry.captureException(error);
      return null;
    }
  }

  async generateContentStream(prompt: string, history: AIMessage[], systemInstruction: string, options?: StreamOptions): Promise<ReadableStream<Uint8Array>> {
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: prompt }] }
    ];

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: options?.temperature ?? 0.6,
          maxOutputTokens: options?.maxTokens ?? 300,
        }
      });

      const encoder = new TextEncoder();
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              if (chunk.text) {
                controller.enqueue(encoder.encode(chunk.text));
              }
            }
          } catch (error) {
            console.error('[AI_PROVIDER] Gemini stream error:', error);
            Sentry.captureException(error);
          } finally {
            controller.close();
          }
        }
      });
    } catch (error) {
      console.error('[AI_PROVIDER] Gemini stream init error:', error);
      Sentry.captureException(error);
      throw new Error('Failed to initialize Gemini stream');
    }
  }
}
