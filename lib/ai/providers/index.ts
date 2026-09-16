import { AIProvider } from './ai-provider';
import { GeminiProvider } from './gemini-provider';
import { NvidiaProvider } from './nvidia-provider';

let chatProvider: AIProvider | null = null;
let analyticalProvider: AIProvider | null = null;

export function getChatProvider(): AIProvider {
  if (chatProvider) return chatProvider;
  
  const providerName = process.env.AI_CHAT_PROVIDER || 'gemini';
  if (providerName === 'gemini') {
    chatProvider = new GeminiProvider();
  } else {
    throw new Error(`Unsupported or unconfigured AI_CHAT_PROVIDER: ${providerName}`);
  }
  return chatProvider;
}

export function getAnalyticalProvider(): AIProvider {
  if (analyticalProvider) return analyticalProvider;
  
  const providerName = process.env.AI_ANALYTICAL_PROVIDER || 'nvidia';
  if (providerName === 'nvidia') {
    analyticalProvider = new NvidiaProvider();
  } else if (providerName === 'gemini') {
    analyticalProvider = new GeminiProvider();
  } else {
    throw new Error(`Unsupported or unconfigured AI_ANALYTICAL_PROVIDER: ${providerName}`);
  }
  return analyticalProvider;
}
