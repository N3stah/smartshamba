import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MpesaC2BPayload, verifyPaymentAmount, isSafaricomIP } from '@/lib/mpesa';
import { sendNotification } from '@/lib/notifications';
import { settlementTemplate } from '@/lib/notifications/templates';
import { postLedgerEntry } from '@/lib/finance/ledger-service';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    if (!isSafaricomIP(clientIP)) {
      console.warn(`[MPESA] Rejected callback from unauthorized IP: ${clientIP}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorized' }, { status: 403 });
    }

    const rateCheck = checkRateLimit(clientIP + ':mpesa');
    if (!rateCheck.allowed) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Rate limited' }, { status: 429 });
    }

    const payload: MpesaC2BPayload = await req.json();
    console.log('[MPESA] Callback received:', JSON.stringify(payload));

    const { TransID, TransAmount, BillRefNumber } = payload;

    if (!TransID || !TransAmount || !BillRefNumber) {
      console.error('[MPESA] Missing required fields');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Missing required fields' });
    }

    if (!/^SS-[A-Z0-9-]+$/.test(BillRefNumber)) {
      console.error(`[MPESA] Invalid BillRefNumber: ${BillRefNumber}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid reference' });
    }

    const existing = await prisma.transaction.findFirst({ where: { mpesaRef: TransID } });
    if (existing) {
      console.warn(`[MPESA] Duplicate TransID: ${TransID}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' });
    }

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

    const amountCheck = verifyPaymentAmount(TransAmount, transaction.totalValue);
    if (!amountCheck.valid) {
      console.error(`[MPESA] ${amountCheck.reason}`);
      return NextResponse.json({ ResultCode: 1, ResultDesc: amountCheck.reason });
    }

    await prisma.transaction.update({
      where: { reference: BillRefNumber },
      data: { status: 'SETTLED', mpesaRef: TransID },
    });
    console.log(`[MPESA] Settled: ${BillRefNumber}, M-PESA: ${TransID}`);

    // V2.0 Stage 5: Record Double-Entry for Buyer Payment (Debit Buyer, Credit Escrow)
    await postLedgerEntry({
      userId: transaction.buyerId,
      userType: 'BUYER',
      transactionId: transaction.id,
      entryType: 'DEBIT',
      amount: parseFloat(TransAmount),
      description: `Payment for Transaction ${BillRefNumber.substring(0, 8)}`,
      reference: TransID
    });
    await postLedgerEntry({
      userId: 'escrow',
      userType: 'ESCROW',
      transactionId: transaction.id,
      entryType: 'CREDIT',
      amount: parseFloat(TransAmount),
      description: `Escrow received for Transaction ${BillRefNumber.substring(0, 8)}`,
      reference: TransID
    });

    // Generate Digital Receipt
    const crypto = require('crypto');
    const receiptHash = crypto.createHash('sha256').update(`${transaction.id}${TransID}${TransAmount}`).digest('hex');
    await prisma.receipt.create({
      data: {
        transactionId: transaction.id,
        userId: transaction.buyerId,
        userType: 'BUYER',
        amount: parseFloat(TransAmount),
        mpesaRef: TransID,
        data: { crop: 'Maize', bags: transaction.quantityBags, reference: transaction.reference, hash: receiptHash }
      }
    }).catch(e => console.error('[Receipt] Creation failed:', e));

    if (transaction.farmer?.phone) {
      const body = settlementTemplate({
        reference:  BillRefNumber,
        buyerName:  transaction.buyer.name,
        totalValue: parseFloat(TransAmount),
        mpesaRef:   TransID,
      });
      sendNotification({
        type:           'SETTLEMENT',
        recipientPhone: transaction.farmer.phone,
        body,
        farmerId:       transaction.farmer.id,
      }).catch((err) => console.error('[MPESA] SMS failed:', err));
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
