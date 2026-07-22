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
    // Add 15-second timeout to prevent hanging
    const res = await withTimeout(
      sms.send({ to: [normalized], message }),
      15000
    );
    const status = res.SMSMessageData.Recipients[0]?.status ?? 'Unknown';
    const success = status === 'Success';
    console.log('[SMS]', success ? 'sent' : 'failed', 'to recipient, status:', status);
    return { success, providerResponse: status };
  } catch (error) {
    const msg = (error as Error).message;
    console.error('[SMS] sendRawSms error:', msg);
    // Sentry capture is handled by the orchestrator (index.ts) to avoid duplicate alerts on retries
    return { success: false, providerResponse: msg };
  }
}
