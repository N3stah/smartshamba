// lib/sms.ts
import AfricasTalking from 'africastalking';

const username = process.env.AT_USERNAME || 'sandbox';
const apiKey = process.env.AT_API_KEY || '';

const africastalking = AfricasTalking({
  username,
  apiKey,
});

const sms = africastalking.SMS;

export async function sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Normalize phone number
    const normalized = to.startsWith('+') ? to : `+${to}`;

    const response = await sms.send({
      to: [normalized],
      message,
      from: process.env.AT_SENDER_ID || undefined, // optional sender ID
    });

    const result = response.SMSMessageData.Recipients[0];
    if (result.status === 'Success') {
      return { success: true };
    } else {
      return { success: false, error: result.status };
    }
  } catch (error) {
    console.error('[SMS send failed]', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send offer confirmation SMS to farmer
 */
export async function sendOfferConfirmationSms(
  phone: string,
  reference: string,
  buyerName: string,
  quantity: number,
  pricePerBag: number,
  totalValue: number
): Promise<{ success: boolean; error?: string }> {
  const message = `SmartShamba: Offer confirmed!\nRef: ${reference}\nBuyer: ${buyerName}\nBags: ${quantity}\nPrice: KSh ${pricePerBag}/bag\nTotal: KSh ${totalValue.toLocaleString()}\nThe buyer will contact you. Dial *384*53374# to view your transactions.`;

  return sendSms(phone, message);
}