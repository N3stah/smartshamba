import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    
    if (!farmerPhone && !buyerPhone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    let userId: string | null = null;
    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      userId = farmer?.id ?? null;
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      userId = buyer?.id ?? null;
    }

    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { userId, keys: subscription.keys },
      create: { userId, endpoint: subscription.endpoint, keys: subscription.keys }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUSH] Subscribe error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
