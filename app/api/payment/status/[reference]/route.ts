import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    if (!reference || !/^SS-[A-Z0-9-]+$/.test(reference)) {
      return NextResponse.json(
        { error: 'Invalid reference format' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      select: {
        reference: true,
        status: true,
        quantityBags: true,
        pricePerBag: true,
        totalValue: true,
        mpesaRef: true,
        createdAt: true,
        buyer: { select: { name: true, location: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      reference: transaction.reference,
      status: transaction.status,
      paid: transaction.status === 'SETTLED',
      quantityBags: transaction.quantityBags,
      pricePerBag: transaction.pricePerBag,
      totalValue: transaction.totalValue,
      mpesaRef: transaction.mpesaRef,
      buyer: transaction.buyer,
      createdAt: transaction.createdAt,
    });
  } catch (error) {
    console.error('[GET /api/payment/status]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
