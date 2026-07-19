import * as Sentry from '@sentry/nextjs';
import AfricasTalking from 'africastalking';

const username = process.env.AT_USERNAME ?? 'sandbox';
const apiKey   = process.env.AT_API_KEY   ?? '';

const at  = AfricasTalking({ username, apiKey });
const sms = at.SMS;

export interface SmsResult {
  success: boolean;
  providerResponse: string;
}

export async function sendRawSms(
  to: string,
  message: string
): Promise<SmsResult> {
  const normalized = to.startsWith('+') ? to : `+${to}`;
  try {
    const res    = await sms.send({ to: [normalized], message });
    const status = res.SMSMessageData.Recipients[0]?.status ?? 'Unknown';
    const success = status === 'Success';
    console.log('[NOTIFICATIONS] SMS', success ? 'sent' : 'failed', 'to recipient, status:', status);
    return { success, providerResponse: status };
  } catch (error) {
    const msg = (error as Error).message;
    console.error('[NOTIFICATIONS] sendRawSms error:', msg);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return { success: false, providerResponse: msg };
  }
}