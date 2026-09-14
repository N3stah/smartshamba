import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);

    let userId: string | null = null;
    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      userId = farmer?.id ?? null;
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      userId = buyer?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { 
        messages: { 
          orderBy: { createdAt: 'asc' } 
        } 
      }
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[API] AI History error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
