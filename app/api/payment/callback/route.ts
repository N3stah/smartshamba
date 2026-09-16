import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[MPESA] C2B Callback received:', JSON.stringify(payload));

    // 1. Validate trusted callback source (Safaricom Daraja IPs in production)
    // For pilot, we rely on the network level. In production, add IP whitelist here.

    // 2. Validate structure
    const { TransID, TransAmount, BusinessShortCode, BillRefNumber, MSISDN } = payload;
    if (!TransID || !TransAmount || !BillRefNumber) {
      console.error('[MPESA] Invalid callback payload structure');
      return NextResponse.json({ success: true }); // Acknowledge to avoid retries
    }

    // 3. Locate transaction by reference (BillRefNumber)
    const transaction = await prisma.transaction.findUnique({
      where: { reference: BillRefNumber }
    });

    if (!transaction) {
      console.error(`[MPESA] Transaction not found for ref: ${BillRefNumber}`);
      return NextResponse.json({ success: true }); // Acknowledge to avoid retries
    }

    // 4. Verify exact amount (prevent underpayment/overpayment fraud)
    const paidAmount = parseFloat(TransAmount);
    if (paidAmount !== transaction.totalValue) {
      console.error(`[MPESA] Amount mismatch for tx ${transaction.id}. Expected: ${transaction.totalValue}, Paid: ${paidAmount}`);
      // Optionally publish an event for admin review here
      return NextResponse.json({ success: true }); // Acknowledge to avoid retries
    }

    // 5. Atomic Settlement Claim
    // Only settle if the transaction is in an eligible state (DELIVERED)
    try {
      const updatedTx = await prisma.transaction.update({
        where: { 
          id: transaction.id,
          status: 'DELIVERED' // Strict state restriction
        },
        data: { 
          status: 'SETTLED', 
          mpesaRef: TransID 
        }
      });

      console.log(`[MPESA] Transaction ${updatedTx.reference} settled successfully.`);

      // 6. Post-settlement side effects (OUTSIDE the DB transaction)
      // Send confirmation SMS
      if (updatedTx.farmerId) {
        const farmer = await prisma.farmer.findUnique({ where: { id: updatedTx.farmerId } });
        if (farmer?.phone) {
          await sendNotification({
            type: 'SETTLEMENT',
            recipientPhone: farmer.phone,
            body: `SmartShamba: Payment received! KSh ${paidAmount} has been sent to your M-PESA. Ref: ${TransID}.`,
            farmerId: farmer.id,
          }).catch(err => console.error('[MPESA] SMS failed:', err));
        }
      }

    } catch (updateError) {
      // This catch handles both concurrent duplicates (P2002) and invalid state transitions
      console.error(`[MPESA] Settlement failed for tx ${transaction.id}:`, updateError);
      // If it was already settled, we acknowledge. If it was in the wrong state, we acknowledge.
      // Do not throw, as we want to return 200 to Safaricom.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MPESA] C2B Callback error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ success: true }); // Always acknowledge to Safaricom
  }
}
