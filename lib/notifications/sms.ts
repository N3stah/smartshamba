import AfricasTalking from 'africastalking';

const username = process.env.AT_USERNAME ?? 'sandbox';
const apiKey   = process.env.AT_API_KEY   ?? '';

const at  = AfricasTalking({ username, apiKey });
const sms = at.SMS;

export interface SmsResult {
  success: boolean;
  providerResponse: string;
}

// Helper to timeout promises and prevent indefinite hanging
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    )
  ]);

export async function sendRawSms(
  to: string,
  message: string
): Promise<SmsResult> {
  const normalized = to.startsWith('+') ? to : `+${to}`;
  try {
    // In sandbox, from must be 'AFRICASTALKING'. In prod, use your shortcode.
    const from = username === 'sandbox' ? 'AFRICASTALKING' : process.env.AT_SHORTCODE;
    
    const res = await withTimeout(
      sms.send({ to: [normalized], message, from }),
      15000
    );
    const status = res.SMSMessageData.Recipients[0]?.status ?? 'Unknown';
    const success = status === 'Success';
    console.log('[SMS]', success ? 'sent' : 'failed', 'to recipient, status:', status);
    return { success, providerResponse: status };
  } catch (error) {
    const msg = (error as Error).message;
    console.error('[SMS] sendRawSms error:', msg);
    return { success: false, providerResponse: msg };
  }
}
