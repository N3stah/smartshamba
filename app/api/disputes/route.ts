import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, reason, description } = body;

    if (!transactionId || !reason) {
      return NextResponse.json({ error: 'Transaction ID and reason are required' }, { status: 400 });
    }

    // 1. Verify transaction exists and is eligible for dispute
    const selectedTx = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!selectedTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (selectedTx.status !== 'DELIVERED' && selectedTx.status !== 'SETTLED') {
      return NextResponse.json({ error: 'Transaction must be DELIVERED or SETTLED to dispute' }, { status: 400 });
    }

    // 2. Create dispute and update transaction status atomically
    const [dispute] = await prisma.$transaction([
      prisma.dispute.create({
        data: {
          transactionId,
          farmerId: selectedTx.farmerId,
          buyerId: selectedTx.buyerId,
          reason,
          description: description ? sanitizeInput(description) : null,
          status: 'OPEN',
        },
      }),
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'DISPUTED' },
      }),
    ]);

    // DCMS Integration: Mark Contract as DISPUTED
    await prisma.contract.updateMany({
      where: { transactionId: selectedTx.id },
      data: { status: 'DISPUTED' }
    }).catch(() => {});

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error('[API] Dispute creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
