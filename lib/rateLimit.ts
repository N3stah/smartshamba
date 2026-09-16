import * as Sentry from '@sentry/nextjs';

/**
 * Simple in-memory rate limiter.
 * Note: resets on server restart and is per-instance in serverless environments.
 * This provides best-effort application-level rate limiting, not globally distributed quota enforcement.
 */

// --- USSD Limiter (Preserved V1 Behavior) ---
const USSD_WINDOW_MS = 60 * 1000; // 1 minute
const USSD_MAX_REQUESTS = 10; // max 10 USSD hops per minute per phone
const ussdStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(phone: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = ussdStore.get(phone);

  if (!record || now > record.resetAt) {
    ussdStore.set(phone, { count: 1, resetAt: now + USSD_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= USSD_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// --- Generic API Limiter ---
const apiStore = new Map<string, { count: number; resetAt: number }>();

export async function checkApiRateLimit(
  identifier: string, 
  limit: number, 
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const now = Date.now();
    const record = apiStore.get(identifier);

    if (!record || now > record.resetAt) {
      apiStore.set(identifier, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }

    if (record.count >= limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    record.count++;
    return { allowed: true };
  } catch (error) {
    // Fail-open for availability, but log to Sentry
    console.error('[RATE_LIMIT] Failure:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return { allowed: true };
  }
}
