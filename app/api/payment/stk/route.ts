import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth'; // Assumed helper
import { initiateStkPush } from '@/lib/mpesa-stk';
import { getPlanDetails } from '@/lib/subscriptions/plans';
import { normalizeMsisdn } from '@/lib/phone';
import { SubscriptionType, SubscriptionBillingPeriod } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, billingPeriod } = body;

    if (!type || !billingPeriod) {
      return NextResponse.json({ error: 'Subscription type and billing period are required' }, { status: 400 });
    }

    const plan = getPlanDetails(type as SubscriptionType, billingPeriod as SubscriptionBillingPeriod);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }

    const normalizedPhone = normalizeMsisdn(user.phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // Idempotency: Check for existing PENDING_PAYMENT within the last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingPending = await prisma.subscription.findFirst({
      where: {
        OR: [{ farmerId: user.id }, { buyerId: user.id }],
        type: type as SubscriptionType,
        status: 'PENDING_PAYMENT',
        createdAt: { gte: fiveMinsAgo },
      },
    });

    if (existingPending) {
      return NextResponse.json({ 
        success: true, 
        message: 'A payment prompt is already active. Please check your phone.',
        checkoutRequestId: existingPending.checkoutRequestId 
      });
    }

    // Create/Reuse Subscription Record
    const subscription = await prisma.subscription.create({
      data: {
        type: type as SubscriptionType,
        billingPeriod: billingPeriod as SubscriptionBillingPeriod,
        status: 'PENDING_PAYMENT',
        priceKsh: plan.priceKsh,
        farmerId: user.role === 'FARMER' ? user.id : null,
        buyerId: user.role === 'BUYER' ? user.id : null,
      },
    });

    // Initiate STK Push
    const stkResult = await initiateStkPush(
      normalizedPhone,
      plan.priceKsh,
      subscription.id,
      `Subscription ${type}`
    );

    if (!stkResult.success || !stkResult.checkoutRequestId) {
      // Update subscription to CANCELLED if initiation fails
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED' },
      });
      return NextResponse.json({ error: stkResult.error || 'STK initiation failed' }, { status: 500 });
    }

    // Save CheckoutRequestID
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { checkoutRequestId: stkResult.checkoutRequestId },
    });

    return NextResponse.json({ success: true, checkoutRequestId: stkResult.checkoutRequestId });

  } catch (error) {
    console.error('[STK] API Error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
