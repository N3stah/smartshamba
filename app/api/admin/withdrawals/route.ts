import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    // Fetch pending withdrawals and join with wallet to get user info
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        wallet: {
          select: { 
            farmerId: true, 
            buyerId: true, 
            providerId: true 
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Map to the format expected by the frontend
    const result = withdrawals.map(w => {
      let userId = 'Unknown';
      let userType = 'Unknown';
      if (w.wallet?.farmerId) { userId = w.wallet.farmerId; userType = 'FARMER'; }
      else if (w.wallet?.buyerId) { userId = w.wallet.buyerId; userType = 'BUYER'; }
      else if (w.wallet?.providerId) { userId = w.wallet.providerId; userType = 'TRANSPORT'; }
      
      return {
        id: w.id,
        amount: w.amount,
        createdAt: w.createdAt,
        userId,
        userType
      };
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
      
      // Update withdrawal status
      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'COMPLETED', mpesaRef, processedAt: new Date() }
      });

      // Deduct from locked balance (funds were already moved to lockedBalance during USSD request)
      await prisma.wallet.update({
        where: { id: updated.walletId },
        data: { lockedBalance: { decrement: updated.amount } }
      });

    } else if (action === 'REJECT') {
      // Update withdrawal status
      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'FAILED', processedAt: new Date() }
      });

      // Reverse the lock: move funds back from lockedBalance to balance
      await prisma.wallet.update({
        where: { id: updated.walletId },
        data: { 
          lockedBalance: { decrement: updated.amount },
          balance: { increment: updated.amount }
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN WITHDRAWALS] PATCH error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
