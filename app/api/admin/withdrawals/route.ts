import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        wallet: {
          select: { farmerId: true, buyerId: true, providerId: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const result = withdrawals.map(w => {
      let userId = 'Unknown';
      let userType = 'Unknown';
      if (w.wallet?.farmerId) { userId = w.wallet.farmerId; userType = 'FARMER'; }
      else if (w.wallet?.buyerId) { userId = w.wallet.buyerId; userType = 'BUYER'; }
      else if (w.wallet?.providerId) { userId = w.wallet.providerId; userType = 'TRANSPORT'; }
      
      return { id: w.id, amount: w.amount, createdAt: w.createdAt, userId, userType };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ADMIN WITHDRAWALS] GET error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const { id, action, mpesaRef } = await req.json();

    if (action === 'APPROVE') {
      if (!mpesaRef) return NextResponse.json({ error: 'M-PESA Ref is required' }, { status: 400 });
      
      // Transactional approval with PENDING guard
      await prisma.$transaction(async (tx) => {
        // 1. Update withdrawal status (only if PENDING)
        const updated = await tx.withdrawalRequest.updateMany({
          where: { id, status: 'PENDING' },
          data: { status: 'COMPLETED', mpesaRef, processedAt: new Date() }
        });

        if (updated.count === 0) throw new Error('Withdrawal not found or already processed');

        // 2. Deduct from locked balance
        const withdrawal = await tx.withdrawalRequest.findUnique({ where: { id } });
        if (!withdrawal) throw new Error('Withdrawal not found');

        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: { lockedBalance: { decrement: withdrawal.amount } }
        });
      });

    } else if (action === 'REJECT') {
      // Transactional rejection with PENDING guard
      await prisma.$transaction(async (tx) => {
        // 1. Update withdrawal status (only if PENDING)
        const updated = await tx.withdrawalRequest.updateMany({
          where: { id, status: 'PENDING' },
          data: { status: 'FAILED', processedAt: new Date() }
        });

        if (updated.count === 0) throw new Error('Withdrawal not found or already processed');

        // 2. Reverse lock: move funds back to balance
        const withdrawal = await tx.withdrawalRequest.findUnique({ where: { id } });
        if (!withdrawal) throw new Error('Withdrawal not found');

        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: { 
            lockedBalance: { decrement: withdrawal.amount },
            balance: { increment: withdrawal.amount }
          }
        });
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN WITHDRAWALS] PATCH error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}
