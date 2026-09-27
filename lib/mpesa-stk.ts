import { getMpesaToken } from './mpesa';
import * as Sentry from '@sentry/nextjs';

const DARAJA_BASE_URL =
  process.env.MPESA_ENV === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke'
    : 'https://api.safaricom.co.ke';

const SHORTCODE = process.env.MPESA_SHORTCODE ?? '174379';
const PASSKEY = process.env.MPESA_PASSKEY ?? '';
const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/stk/callback`;

interface StkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
}

export async function initiateStkPush(
  phone: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<StkPushResult> {
  try {
    const token = await getMpesaToken();
    
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
      
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    const res = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.ResponseCode === '0') {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      };
    } else {
      return { success: false, error: data.errorMessage || data.ResponseDescription };
    }
  } catch (error) {
    console.error('[STK] Initiation error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return { success: false, error: 'Failed to initiate STK push' };
  }
}
