import AfricasTalking from 'africastalking';

const username = process.env.AT_USERNAME ?? 'sandbox';
const apiKey   = process.env.AT_API_KEY   ?? '';

console.log('[SMS] Initializing Africa\'s Talking SDK. Username:', username, 'API Key present:', !!apiKey);

let at: any;
let sms: any;

try {
  at = AfricasTalking({ username, apiKey });
  sms = at.SMS;
  console.log('[SMS] Africa\'s Talking SDK initialized successfully.');
} catch (initError) {
  console.error('[SMS] CRITICAL: Failed to initialize Africa\'s Talking SDK:', (initError as Error).message);
}

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
  console.log('[SMS] Attempting to send SMS to:', to);
  
  if (!sms) {
    console.error('[SMS] SMS service is not initialized.');
    return { success: false, providerResponse: 'SMS service not initialized' };
  }

  const normalized = to.startsWith('+') ? to : `+${to}`;
  try {
    const payload: any = { to: [normalized], message };
    if (username !== 'sandbox' && process.env.AT_SHORTCODE) {
      payload.from = process.env.AT_SHORTCODE;
    }
    
    console.log('[SMS] Sending payload:', JSON.stringify(payload));
    
    const res = await withTimeout(
      sms.send(payload),
      15000
    );
    
    console.log('[SMS] Raw AT Response:', JSON.stringify(res));
    
    const status = res.SMSMessageData.Recipients[0]?.status ?? 'Unknown';
    const success = status === 'Success';
    console.log('[SMS]', success ? 'sent' : 'failed', 'to recipient, status:', status);
    return { success, providerResponse: status };
  } catch (error: any) {
    console.error('[SMS] sendRawSms error:', error.message);
    console.error('[SMS] Error details:', JSON.stringify(error));
    return { success: false, providerResponse: error.message };
  }
}
