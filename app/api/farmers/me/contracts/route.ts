// @ts-nocheck
// TODO: V2 - Re-enable type checking after groupTx relation is built
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    // Get all contracts for transactions where this farmer is involved
    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { transaction: { farmerId: farmer.id } },
          { groupTx: { group: { members: { some: { farmerId: farmer.id } } } } }
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
    console.error('[API] Farmer contracts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
