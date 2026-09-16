import { EventOutbox } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

export async function handleDisputeOpened(event: EventOutbox): Promise<void> {
  const { farmerId, buyerId, transactionId, disputeId } = event.payload as {
    farmerId: string;
    buyerId: string;
    transactionId: string;
    disputeId: string;
  };

  // Idempotency check
  const existing = await prisma.trustEvent.findFirst({
    where: { relatedId: disputeId, eventType: 'DISPUTE_OPENED' }
  });
  if (existing) {
    console.log(`[EVENTS] Dispute opened event already processed for ${disputeId}`);
    return;
  }

  await recordTrustEvent({
    userId: farmerId,
    userType: 'FARMER',
    eventType: 'DISPUTE_OPENED',
    impact: -2,
    description: `Dispute opened for transaction ${transactionId}`,
    relatedId: disputeId,
  });
  await recordTrustEvent({
    userId: buyerId,
    userType: 'BUYER',
    eventType: 'DISPUTE_OPENED',
    impact: -2,
    description: `Dispute opened for transaction ${transactionId}`,
    relatedId: disputeId,
  });
}
