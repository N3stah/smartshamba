import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Asserts that a user is not frozen and can participate in transactions.
 * Returns a NextResponse error if frozen, otherwise returns null.
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
    // Fail safe: if we can't check, we allow the transaction but log the error
    return null;
  }
}
