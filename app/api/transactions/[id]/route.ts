import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot confirm. Current status: ${transaction.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { farmer: true, buyer: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/transactions/[id]]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
