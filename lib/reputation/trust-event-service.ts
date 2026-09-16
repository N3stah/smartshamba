import { prisma } from '@/lib/prisma';
import { TrustUserType } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

/**
 * Records a TrustEvent audit trail entry.
 * This should be called when meaningful domain events occur 
 * (e.g., transaction settled, dispute resolved, transport completed).
 */
export async function recordTrustEvent(params: {
  userId: string;
  userType: TrustUserType;
  eventType: string;
  impact: number; // Positive for good behavior, negative for adverse
  description?: string;
  relatedId?: string; // e.g., Transaction ID, Booking ID
}) {
  try {
    await prisma.trustEvent.create({
      data: {
        userId: params.userId,
        userType: params.userType,
        eventType: params.eventType,
        impact: params.impact,
        description: params.description,
        relatedId: params.relatedId,
      }
    });
  } catch (error) {
    // We catch and log to prevent a failed audit trail from breaking a transaction flow
    console.error('[TRUST] Failed to record trust event:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
  }
}
