// lib/sms.ts
import AfricasTalking from 'africastalking';

const username = process.env.AT_USERNAME || 'sandbox';
const apiKey = process.env.AT_API_KEY || '';

console.log('[SMS] Provider initialized');

const africastalking = AfricasTalking({
  username,
  apiKey,
});

const sms = africastalking.SMS;

export async function sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = to.startsWith('+') ? to : `+${to}`;
    console.log('[SMS] Sending SMS to recipient');

        const response = await sms.send({
      to: [normalized],
      message,
    });

    console.log('[SMS] Response:', JSON.stringify(response.SMSMessageData));
    const result = response.SMSMessageData.Recipients[0];
    return { success: result.status === 'Success', error: result.status !== 'Success' ? result.status : undefined };
  } catch (error) {
    console.error('[SMS] ERROR:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendOfferConfirmationSms(
  phone: string,
  reference: string,
  buyerName: string,
  quantity: number,
  pricePerBag: number,
  totalValue: number
): Promise<{ success: boolean; error?: string }> {
  const message = `SmartShamba: Offer confirmed!\nRef: ${reference}\nBuyer: ${buyerName}\nBags: ${quantity}\nPrice: KSh ${pricePerBag}/bag\nTotal: KSh ${totalValue.toLocaleString()}\nThe buyer will contact you. Dial *384*53374# to view your transactions.`;
  console.log('[SMS] Sending SMS to recipient');
  return sendSms(phone, message);
}