import AfricasTalking from 'africastalking';

const username = process.env.AT_USERNAME ?? 'sandbox';
const apiKey   = process.env.AT_API_KEY   ?? '';

console.log('[SMS] Initializing Africa\'s Talking SDK. Username:', username, 'API Key present:', !!apiKey);

const at = AfricasTalking({ username, apiKey });
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
  console.log('[SMS] Attempting to send SMS to:', to);

  const normalized = to.startsWith('+') ? to : `+${to}`;
  try {
    const payload: { to: string[]; message: string; from?: string } = { to: [normalized], message };
    if (username !== 'sandbox' && process.env.AT_SHORTCODE) {
      payload.from = process.env.AT_SHORTCODE;
    }
    
    console.log('[SMS] Sending payload:', JSON.stringify(payload));
    
    const res = await withTimeout(
      sms.send(payload) as Promise<ATResponse>,
      15000
    );
    
    console.log('[SMS] Raw AT Response:', JSON.stringify(res));
    
    const status = res.SMSMessageData.Recipients[0]?.status ?? 'Unknown';
    const success = status === 'Success';
    console.log('[SMS]', success ? 'sent' : 'failed', 'to recipient, status:', status);
    return { success, providerResponse: status };
  } catch (error) {
    const err = error as Error;
    console.error('[SMS] sendRawSms error:', err.message);
    console.error('[SMS] Error details:', JSON.stringify(err));
    return { success: false, providerResponse: err.message };
  }
}
