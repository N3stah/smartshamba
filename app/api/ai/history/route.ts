import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    const isAdmin = !requireAdminAuth(req);

    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      userId = farmer?.id ?? null;
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      userId = buyer?.id ?? null;
    } else if (isAdmin) {
      userId = 'admin';
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('[API] History error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
