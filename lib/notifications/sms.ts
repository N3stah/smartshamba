/**
 * Africa's Talking SMS via direct REST API calls.
 * Replaces the africastalking SDK to avoid jsdom ESM/CJS crashes on Vercel.
 */

const username = process.env.AT_USERNAME ?? 'sandbox';
const apiKey   = process.env.AT_API_KEY   ?? '';

export interface SmsResult {
  success: boolean;
  providerResponse: string;
}

interface ATRecipient {
  status: string;
}

interface ATResponse {
  SMSMessageData: {
    Recipients: ATRecipient[];
  };
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);

export async function sendRawSms(to: string, message: string): Promise<SmsResult> {
  const normalized = to.startsWith('+') ? to : `+${to}`;

  if (!apiKey) {
    console.warn('[SMS] AT_API_KEY not configured — skipping send');
    return { success: false, providerResponse: 'AT_API_KEY not configured' };
  }

  try {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('to', normalized);
    params.append('message', message);

    if (username !== 'sandbox' && process.env.AT_SHORTCODE) {
      params.append('from', process.env.AT_SHORTCODE);
    }

    // 8s timeout — safely under Vercel hobby plan's 10s limit
    const res = await withTimeout(
      fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params,
      }),
      8000
    );

    const data: ATResponse = await res.json();
    const status  = data.SMSMessageData?.Recipients?.[0]?.status ?? 'Unknown';
    const success = status === 'Success';

    console.log('[SMS]', success ? 'sent' : 'failed', 'status:', status, 'to:', normalized);
    return { success, providerResponse: status };
  } catch (error) {
    const err = error as Error;
    console.error('[SMS] sendRawSms error:', err.message);
    return { success: false, providerResponse: err.message };
  }
}
