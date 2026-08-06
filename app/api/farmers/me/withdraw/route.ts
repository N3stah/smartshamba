import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const { amount } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const balance = await getWalletBalance(farmer.id, 'FARMER');
    if (amount > balance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Create withdrawal request (Admin will approve later)
    const request = await prisma.withdrawalRequest.create({
      data: {
        userId: farmer.id,
        userType: 'FARMER',
        amount: amount,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('[API] Withdrawal request error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
