import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MpesaC2BPayload, verifyPaymentAmount, isSafaricomIP } from '@/lib/mpesa';
import { sendSms } from '@/lib/sms';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. IP Whitelist
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    if (!isSafaricomIP(clientIP)) {
      console.warn(`[MPESA] Rejected callback from unauthorized IP: ${clientIP}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorized' }, { status: 403 });
    }

    // 2. Rate Limit
    const rateCheck = checkRateLimit(clientIP + ':mpesa');
    if (!rateCheck.allowed) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Rate limited' }, { status: 429 });
    }

    const payload: MpesaC2BPayload = await req.json();
    console.log('[MPESA] Callback received:', JSON.stringify(payload));

    const { TransID, TransAmount, BillRefNumber, MSISDN, FirstName } = payload;

    // 3. Validate required fields
    if (!TransID || !TransAmount || !BillRefNumber) {
      console.error('[MPESA] Missing required fields');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Missing required fields' });
    }

    // 4. Validate reference format
    if (!/^SS-[A-Z0-9-]+$/.test(BillRefNumber)) {
      console.error(`[MPESA] Invalid BillRefNumber: ${BillRefNumber}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid reference' });
    }

    // 5. Check for duplicate M-PESA transaction
    const existing = await prisma.transaction.findFirst({
      where: { mpesaRef: TransID },
    });
    if (existing) {
      console.warn(`[MPESA] Duplicate TransID: ${TransID}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' });
    }

    // 6. Find and validate transaction
    const transaction = await prisma.transaction.findUnique({
      where: { reference: BillRefNumber },
      include: { farmer: true, buyer: true },
    });

    if (!transaction) {
      console.error(`[MPESA] Transaction not found: ${BillRefNumber}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Transaction not found' });
    }

    if (transaction.status === 'SETTLED') {
      console.warn(`[MPESA] Already settled: ${BillRefNumber}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already settled' });
    }

    // 7. Verify amount
    const amountCheck = verifyPaymentAmount(TransAmount, transaction.totalValue);
    if (!amountCheck.valid) {
      console.error(`[MPESA] ${amountCheck.reason}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: amountCheck.reason });
    }

    // 8. Settle transaction
    await prisma.transaction.update({
      where: { reference: BillRefNumber },
      data: { status: 'SETTLED', mpesaRef: TransID },
    });
    console.log(`[MPESA] Settled: ${BillRefNumber}, M-PESA: ${TransID}`);

    // 9. Notify farmer
    if (transaction.farmer?.phone) {
      const msg = `SmartShamba: Payment confirmed!\nRef: ${BillRefNumber}\nAmount: KSh ${parseFloat(TransAmount).toLocaleString()}\nFrom: ${FirstName ?? MSISDN}\nBuyer: ${transaction.buyer.name}`;
      await sendSms(transaction.farmer.phone, msg).catch(err => 
        console.error('[MPESA] SMS failed:', err)
      );
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('[MPESA] Callback error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

export async function GET() {
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}