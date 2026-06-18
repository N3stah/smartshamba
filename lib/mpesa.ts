/**
 * Safaricom Daraja M-PESA C2B Integration
 * Handles: OAuth token generation, C2B URL registration, payment verification
 */

const DARAJA_BASE_URL =
  process.env.MPESA_ENV === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke'
    : 'https://api.safaricom.co.ke';

const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY ?? '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET ?? '';
const SHORTCODE       = process.env.MPESA_SHORTCODE ?? '174379';
const CALLBACK_URL    = process.env.MPESA_CALLBACK_URL ?? '';

/**
 * Generate OAuth Bearer Token
 * Required for all Daraja API calls
 */
export async function getMpesaToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  const res = await fetch(
    `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
  const body = await res.text();

  throw new Error(
    `Failed to get M-PESA token: ${res.status} ${res.statusText} - ${body}`
  );
}

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(`M-PESA token response missing access_token: ${JSON.stringify(data)}`);
  }

  console.log('[MPESA] Token generated successfully');
  return data.access_token;
}

/**
 * Register C2B Confirmation and Validation URLs
 * Must be called once to tell Safaricom where to send payment callbacks
 */
export async function registerC2BUrl(): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getMpesaToken();

    const payload = {
      ShortCode:       SHORTCODE,
      ResponseType:    'Completed',
      ConfirmationURL: CALLBACK_URL,
      ValidationURL:   CALLBACK_URL,
    };

    const res = await fetch(`${DARAJA_BASE_URL}/mpesa/c2b/v1/registerurl`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('[MPESA] C2B URL registration response:', JSON.stringify(data));

    return {
      success: data.ResponseCode === '0' || data.ResponseDescription?.includes('success'),
      message: data.ResponseDescription ?? JSON.stringify(data),
    };
  } catch (error) {
    console.error('[MPESA] C2B URL registration failed:', (error as Error).message);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Daraja C2B Callback Payload
 * Shape of what Safaricom POSTs to /api/payment/callback
 */
export interface MpesaC2BPayload {
  TransactionType: string;
  TransID:         string;  // M-PESA transaction ID e.g. "QK31YZX3HQ"
  TransAmount:     string;  // Amount paid e.g. "168000.00"
  BusinessShortCode: string;
  BillRefNumber:   string;  // Buyer enters this — matches transaction.reference
  InvoiceNumber?:  string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN:          string;  // Buyer phone number
  FirstName?:      string;
  MiddleName?:     string;
  LastName?:       string;
  TransTime?:      string;
}

/**
 * Verify a C2B payment payload
 * Returns the matched transaction reference or null
 */
export function verifyPaymentAmount(
  paidAmount: string,
  expectedAmount: number
): { valid: boolean; reason?: string } {
  const paid = parseFloat(paidAmount);

  if (isNaN(paid)) {
    return { valid: false, reason: `Invalid amount: ${paidAmount}` };
  }

  if (paid < expectedAmount) {
    return {
      valid: false,
      reason: `Underpayment: paid KSh ${paid}, expected KSh ${expectedAmount}`,
    };
  }

  return { valid: true };
}

/**
 * Check if IP is from Safaricom's known ranges
 * Allows localhost for testing
 */
export function isSafaricomIP(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  return ip.startsWith('196.201.214.') || ip.startsWith('196.201.215.');
}