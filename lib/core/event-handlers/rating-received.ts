import { EventOutbox } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

export async function handleRatingReceived(event: EventOutbox): Promise<void> {
  const { buyerId, score, transactionId, ratingId } = event.payload as {
    buyerId: string;
    score: number;
    transactionId: string;
    ratingId: string;
  };

  // Idempotency check
  const existing = await prisma.trustEvent.findFirst({
    where: { relatedId: ratingId, eventType: 'RATING_RECEIVED' }
  });
  if (existing) {
    console.log(`[EVENTS] Rating received event already processed for ${ratingId}`);
    return;
  }

  await calculateAndSaveTrustScore(buyerId, 'BUYER');
  await recordTrustEvent({
    userId: buyerId,
    userType: 'BUYER',
    eventType: 'RATING_RECEIVED',
    impact: score - 3,
    description: `Received a rating of ${score}/5 for transaction ${transactionId}`,
    relatedId: ratingId,
  });
}
