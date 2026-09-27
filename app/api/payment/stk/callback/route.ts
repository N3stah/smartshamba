import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlanDetails } from '@/lib/subscriptions/plans';
import { publishEvent } from '@/lib/core/event-bus';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[STK] Callback received:', JSON.stringify(payload));

    const callback = payload.Body?.stkCallback;
    if (!callback) {
      console.error('[STK] Malformed callback payload');
      return NextResponse.json({ success: true }); // Acknowledge
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
    
    const subscription = await prisma.subscription.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
    });

    if (!subscription) {
      console.error(`[STK] Unknown CheckoutRequestID: ${CheckoutRequestID}`);
      return NextResponse.json({ success: true }); // Acknowledge
    }

    // Idempotency: Already processed
    if (subscription.status === 'ACTIVE') {
      console.log(`[STK] Subscription ${subscription.id} already ACTIVE. Ignoring duplicate.`);
      return NextResponse.json({ success: true });
    }

    if (ResultCode !== 0) {
      console.warn(`[STK] Payment failed for ${subscription.id}: ${ResultDesc}`);
      // Leave as PENDING_PAYMENT for retry, or update to CANCELLED if preferred
      return NextResponse.json({ success: true });
    }

    // Extract receipt and amount
    const metadata = CallbackMetadata?.Item || [];
    const mpesaRef = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
    const amountPaid = metadata.find((i: any) => i.Name === 'Amount')?.Value;

    if (!mpesaRef || !amountPaid) {
      console.error(`[STK] Missing receipt or amount in callback for ${subscription.id}`);
      return NextResponse.json({ success: true });
    }

    // Amount Validation
    if (parseFloat(amountPaid) !== subscription.priceKsh) {
      console.error(`[STK] Amount mismatch for ${subscription.id}. Expected: ${subscription.priceKsh}, Paid: ${amountPaid}`);
      return NextResponse.json({ success: true });
    }

    // Calculate Expiry
    const plan = getPlanDetails(subscription.type, subscription.billingPeriod!);
    if (!plan) {
      console.error(`[STK] Plan details not found for ${subscription.id}`);
      return NextResponse.json({ success: true });
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Atomic Activation (Transaction for concurrency safety)
    try {
      const updatedSub = await prisma.subscription.update({
        where: { 
          id: subscription.id,
          status: 'PENDING_PAYMENT' // Ensures only one activation occurs
        },
        data: { 
          status: 'ACTIVE', 
          startedAt, 
          expiresAt, 
          mpesaRef 
        },
      });

      // Publish Event for Notification (Idempotent)
      await publishEvent({
        eventType: 'SUBSCRIPTION_ACTIVATED',
        aggregateId: updatedSub.id,
        eventKey: `sub_activated_${updatedSub.id}`,
        payload: { 
          subscriptionId: updatedSub.id, 
          userId: updatedSub.farmerId || updatedSub.buyerId 
        },
      }).catch(e => console.error('[STK] EventOutbox publish failed:', e));

      console.log(`[STK] Subscription ${updatedSub.id} activated successfully.`);
    } catch (updateError) {
      // Catches concurrent duplicate callbacks (P2022 or P2002 if using unique constraint, or 0 records updated)
      console.error(`[STK] Activation failed for ${subscription.id}:`, updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[STK] Callback error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ success: true }); // Always acknowledge to Safaricom
  }
}
