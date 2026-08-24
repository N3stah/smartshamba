import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);

    let userId: string | null = null;
    let userType: string | null = null;

    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      userId = farmer?.id ?? null;
      userType = 'FARMER';
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      userId = buyer?.id ?? null;
      userType = 'BUYER';
    }

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trustScore = await (prisma as any).trustScore.findUnique({
      where: { userId_userType: { userId, userType } }
    });

    return NextResponse.json(trustScore);
  } catch (error) {
    console.error('[API] Reputation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
