import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Asserts that a user is not frozen and can participate in transactions.
 * FAIL-CLOSED: If the database lookup fails, the transaction is denied.
 */
export async function assertUserCanTransact(userId: string, userType: 'FARMER' | 'BUYER'): Promise<NextResponse | null> {
  try {
    let isFrozen = false;
    let frozenReason = null;

    if (userType === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({
        where: { id: userId },
        select: { isFrozen: true, frozenReason: true }
      });
      isFrozen = farmer?.isFrozen ?? false;
      frozenReason = farmer?.frozenReason;
    } else if (userType === 'BUYER') {
      const buyer = await prisma.buyer.findUnique({
        where: { id: userId },
        select: { isFrozen: true, frozenReason: true }
      });
      isFrozen = buyer?.isFrozen ?? false;
      frozenReason = buyer?.frozenReason;
    }

    if (isFrozen) {
      return NextResponse.json(
        { error: `Account is frozen. Reason: ${frozenReason || 'Contact support'}` },
        { status: 403 }
      );
    }

    return null; // User is not frozen, proceed
  } catch (error) {
    console.error('[TRUST_GUARD] Error checking freeze status:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    // FAIL-CLOSED: Deny transaction if we cannot verify eligibility
    return NextResponse.json(
      { error: 'Unable to verify transaction eligibility.' },
      { status: 403 }
    );
  }
}
