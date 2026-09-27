import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession } from '@/lib/auth';
import { initiateStkPush } from '@/lib/mpesa-stk';
import { getPlanDetails } from '@/lib/subscriptions/plans';
import { normalizeMsisdn } from '@/lib/phone';
import { SubscriptionType, SubscriptionBillingPeriod } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    let userType: 'FARMER' | 'BUYER' | null = null;
    let userId: string | null = null;
    let phone: string | null = null;

    // 1. Authenticate Farmer or Buyer
    const farmerPhone = getFarmerSession(req);
    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      if (farmer) {
        userType = 'FARMER';
        userId = farmer.id;
        phone = farmer.phone;
      }
    }

    if (!userId) {
      const buyerPhone = getBuyerSession(req);
      if (buyerPhone) {
        const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
        if (buyer) {
          userType = 'BUYER';
          userId = buyer.id;
          phone = buyer.phone;
        }
      }
    }

    if (!userId || !phone || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, billingPeriod } = body;

    if (!type || !billingPeriod) {
      return NextResponse.json({ error: 'Subscription type and billing period are required' }, { status: 400 });
    }

    // 2. Server-Side Pricing Authority
    const plan = getPlanDetails(type as SubscriptionType, billingPeriod as SubscriptionBillingPeriod);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }

    const normalizedPhone = normalizeMsisdn(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // 3. Initiation Idempotency (Check for existing PENDING_PAYMENT within last 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingPending = await prisma.subscription.findFirst({
      where: {
        OR: [{ farmerId: userId }, { buyerId: userId }],
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

    // 4. Create PENDING_PAYMENT Subscription
    const subscription = await prisma.subscription.create({
      data: {
        type: type as SubscriptionType,
        billingPeriod: billingPeriod as SubscriptionBillingPeriod,
        status: 'PENDING_PAYMENT',
        priceKsh: plan.priceKsh,
        farmerId: userType === 'FARMER' ? userId : null,
        buyerId: userType === 'BUYER' ? userId : null,
      },
    });

    // 5. Initiate STK Push
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

    // 6. Save CheckoutRequestID
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
