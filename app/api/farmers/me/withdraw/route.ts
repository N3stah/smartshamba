import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { getOrCreateWalletId } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);

    const farmer = await prisma.farmer.findUnique({ where: { phone: phone as string } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const { amount } = await req.json();

    const walletId = await getOrCreateWalletId(farmer.id, 'FARMER');
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });

    if (amount > wallet.balance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const request = await prisma.withdrawalRequest.create({
      data: {
        walletId: walletId,
        amount: amount,
        mpesaPhone: farmer.phone,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('[API] Withdrawal request error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
