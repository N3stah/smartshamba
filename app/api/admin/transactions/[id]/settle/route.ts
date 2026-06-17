import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { sendSms } from '@/lib/sms';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { mpesaRef, notifyFarmer = true } = body;

    if (!mpesaRef || typeof mpesaRef !== 'string' || mpesaRef.trim() === '') {
      return NextResponse.json(
        { error: 'mpesaRef is required for manual settlement' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { farmer: true, buyer: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status === 'SETTLED') {
      return NextResponse.json(
        { error: 'Transaction already settled' },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: 'SETTLED',
        mpesaRef: mpesaRef.trim(),
      },
      include: { farmer: true, buyer: true },
    });

    console.log(`[ADMIN] Manually settled transaction ${updated.reference} with ref ${mpesaRef}`);

    let smsResult = null;
    if (notifyFarmer && updated.farmer?.phone) {
      const message = `SmartShamba: Payment confirmed!\nRef: ${updated.reference}\nAmount: KSh ${updated.totalValue.toLocaleString()}\nBuyer: ${updated.buyer.name}\nTransaction settled (manual confirmation).`;
      smsResult = await sendSms(updated.farmer.phone, message).catch((err) => {
        console.error('[ADMIN] SMS failed:', err);
        return { success: false, error: (err as Error).message };
      });
    }

    return NextResponse.json({
      transaction: updated,
      smsResult,
    });
  } catch (error) {
    console.error('[ADMIN] Manual settlement error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
