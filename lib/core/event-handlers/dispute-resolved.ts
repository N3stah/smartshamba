import { EventOutbox } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

export async function handleDisputeResolved(event: EventOutbox): Promise<void> {
  const { farmerId, buyerId, transactionId, disputeId } = event.payload as {
    farmerId: string;
    buyerId: string;
    transactionId: string;
    disputeId: string;
  };

  // Idempotency check
  const existing = await prisma.trustEvent.findFirst({
    where: { relatedId: disputeId, eventType: 'DISPUTE_RESOLVED' }
  });
  if (existing) {
    console.log(`[EVENTS] Dispute resolved event already processed for ${disputeId}`);
    return;
  }

  await calculateAndSaveTrustScore(farmerId, 'FARMER');
  await calculateAndSaveTrustScore(buyerId, 'BUYER');
  await recordTrustEvent({
    userId: farmerId,
    userType: 'FARMER',
    eventType: 'DISPUTE_RESOLVED',
    impact: -5,
    description: `Dispute resolved/closed for transaction ${transactionId}`,
    relatedId: disputeId,
  });
  await recordTrustEvent({
    userId: buyerId,
    userType: 'BUYER',
    eventType: 'DISPUTE_RESOLVED',
    impact: -5,
    description: `Dispute resolved/closed for transaction ${transactionId}`,
    relatedId: disputeId,
  });
}
