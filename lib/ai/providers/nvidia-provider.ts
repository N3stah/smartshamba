import * as Sentry from '@sentry/nextjs';
import { AIProvider, GenerateOptions } from './ai-provider';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = 'deepseek-ai/deepseek-v4-flash-0731'; // Configured analytical model

export class NvidiaProvider implements AIProvider {
  constructor() {
    if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is not configured');
  }

  async generateResponse(prompt: string, options?: GenerateOptions): Promise<string | null> {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: options?.temperature ?? 0.4,
          max_tokens: options?.maxTokens ?? 1024,
          response_format: options?.jsonMode ? { type: "json_object" } : undefined
        })
      });
      
      if (!res.ok) {
        console.error('[AI_PROVIDER] NVIDIA API error:', res.status, await res.text());
        return null;
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('[AI_PROVIDER] NVIDIA generateResponse error:', error);
      Sentry.captureException(error);
      return null;
    }
  }
}
