import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const phone = getBuyerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({ where: { phone } });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const contracts = await (prisma as any).contract.findMany({
      where: {
        OR: [
          { transaction: { buyerId: buyer.id } },
          { groupTx: { buyerId: buyer.id } }
        ]
      },
      include: {
        transaction: { select: { reference: true, quantityBags: true, totalValue: true, status: true } },
        groupTx: { select: { reference: true, totalBags: true, totalValue: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('[API] Buyer contracts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
