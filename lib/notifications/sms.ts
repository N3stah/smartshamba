import AfricasTalking from 'africastalking';

const username = process.env.AT_USERNAME ?? 'sandbox';
const apiKey   = process.env.AT_API_KEY   ?? '';

console.log('[SMS] Provider initialized');

const at  = AfricasTalking({ username, apiKey });
const sms = at.SMS;

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

  try {
    const payload: { to: string[]; message: string; from?: string } = {
      to: [normalized],
      message,
    };

    if (username !== 'sandbox' && process.env.AT_SHORTCODE) {
      payload.from = process.env.AT_SHORTCODE;
    }

    // 8s timeout — safely under Vercel hobby plan's 10s limit
    const res = await withTimeout(
      sms.send(payload) as Promise<ATResponse>,
      8000
    );

    const status  = res.SMSMessageData.Recipients[0]?.status ?? 'Unknown';
    const success = status === 'Success';

    console.log('[SMS]', success ? 'sent' : 'failed', 'status:', status, 'to:', normalized);
    return { success, providerResponse: status };
  } catch (error) {
    const err = error as Error;
    console.error('[SMS] sendRawSms error:', err.message);
    return { success: false, providerResponse: err.message };
  }
}
