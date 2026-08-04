import * as Sentry from '@sentry/nextjs';

// Maximum allowed length for user messages to prevent token abuse/DoS
export const MAX_AI_MESSAGE_LENGTH = 500;

// Basic Profanity/Blocklist (can be expanded)
const BLOCKED_PATTERNS = [
  /ignore previous/i, /ignore all previous/i, /disregard all/i,
  /system prompt/i, /reveal your instructions/i, /you are now/i,
  /act as/i, /pretend you are/i, /sudo/i, /rm -rf/i
];

/**
 * Sanitizes user input to prevent basic prompt injection.
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  // 1. Truncate to prevent DoS
  let sanitized = input.slice(0, MAX_AI_MESSAGE_LENGTH);
  
  // 2. Remove control characters and excessive whitespace
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '').trim();
  
  // 3. Escape backticks and dollar signs to prevent template literal injection in JS
  sanitized = sanitized.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  
  return sanitized;
}

/**
 * Checks if the user is attempting a known prompt injection attack.
 */
export function detectPromptInjection(input: string): boolean {
  const lowerInput = input.toLowerCase();
  return BLOCKED_PATTERNS.some(pattern => pattern.test(lowerInput));
}

/**
 * Sanitizes the AI's output before displaying it to the user.
 */
export function sanitizeAIOutput(output: string): string {
  if (!output) return '';
  
  // Prevent the AI from outputting markdown scripts or iframes (ES2018 compatible)
  let sanitized = output.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  
  // If the AI accidentally reveals the system prompt, strip it
  const systemPromptIndicator = "SYSTEM INSTRUCTIONS";
  if (sanitized.includes(systemPromptIndicator)) {
    Sentry.captureMessage('AI Security Alert: System prompt leakage detected', 'warning');
    sanitized = "I cannot fulfill that request.";
  }
  
  return sanitized.trim();
}
