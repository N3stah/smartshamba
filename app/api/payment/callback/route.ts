import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MpesaC2BPayload, verifyPaymentAmount } from '@/lib/mpesa';
import { sendSms } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const payload: MpesaC2BPayload = await req.json();

    console.log('[MPESA] Callback received:', JSON.stringify(payload));

    const {
      TransID,
      TransAmount,
      BillRefNumber,
      MSISDN,
      FirstName,
    } = payload;

    // Validate required fields
    if (!TransID || !TransAmount || !BillRefNumber) {
      console.error('[MPESA] Missing required fields in callback payload');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Missing required fields' });
    }

    // Find transaction by reference (BillRefNumber)
    const transaction = await prisma.transaction.findUnique({
      where: { reference: BillRefNumber },
      include: { farmer: true, buyer: true },
    });

    if (!transaction) {
      console.error(`[MPESA] Transaction not found for reference: ${BillRefNumber}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Transaction not found' });
    }

    // Check transaction is in a payable state
    if (transaction.status === 'SETTLED') {
      console.warn(`[MPESA] Transaction ${BillRefNumber} already settled`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already settled' });
    }

    // Verify payment amount — prevent underpayment fraud
    const amountCheck = verifyPaymentAmount(TransAmount, transaction.totalValue);
    if (!amountCheck.valid) {
      console.error(`[MPESA] Amount mismatch: ${amountCheck.reason}`);
      // Still acknowledge to Safaricom but don't settle
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: amountCheck.reason,
      });
    }

    // Update transaction to SETTLED
    await prisma.transaction.update({
      where: { reference: BillRefNumber },
      data: {
        status:   'SETTLED',
        mpesaRef: TransID,
      },
    });

    console.log(`[MPESA] Transaction ${BillRefNumber} settled. M-PESA ref: ${TransID}`);

    // Send SMS to farmer
    const farmerPhone = transaction.farmer.phone;
    const smsMessage  = `SmartShamba: Payment confirmed!\nRef: ${BillRefNumber}\nAmount: KSh ${parseFloat(TransAmount).toLocaleString()}\nFrom: ${FirstName ?? MSISDN}\nBuyer: ${transaction.buyer.name}\nTransaction settled.`;

    const smsResult = await sendSms(farmerPhone, smsMessage);
    console.log('[MPESA] Farmer SMS result:', JSON.stringify(smsResult));

    // Acknowledge to Safaricom — must return ResultCode 0
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('[MPESA] Callback error:', (error as Error).message);
    // Always return 200 to Safaricom to prevent retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

// Validation endpoint — Safaricom calls this before confirming payment
export async function GET(req: NextRequest) {
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
