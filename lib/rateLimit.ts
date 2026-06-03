/**
 * Simple in-memory rate limiter for USSD endpoint.
 * Limits each phone number to MAX_REQUESTS per WINDOW_MS.
 * Note: resets on server restart — sufficient for pilot stage.
 */

const WINDOW_MS    = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;        // max 10 USSD hops per minute per phone

const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(phone: string): { allowed: boolean; retryAfter?: number } {
  const now    = Date.now();
  const record = store.get(phone);

  if (!record || now > record.resetAt) {
    store.set(phone, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}
