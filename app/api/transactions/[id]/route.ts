import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      console.error(`[TRANSACTIONS] Confirm failed - not found: ${id}`);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'PENDING') {
      console.warn(`[TRANSACTIONS] Confirm rejected - status ${transaction.status}: ${id}`);
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

    console.log(`[TRANSACTIONS] Confirmed: ${updated.reference}`);

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[TRANSACTIONS] PUT error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
