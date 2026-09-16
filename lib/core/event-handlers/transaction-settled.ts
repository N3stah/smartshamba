import { EventOutbox } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

export async function handleTransactionSettled(event: EventOutbox): Promise<void> {
  const { farmerId, buyerId, reference, transactionId } = event.payload as {
    farmerId: string;
    buyerId: string;
    reference: string;
    transactionId: string;
  };

  // Idempotency: Check if a TrustEvent for this transaction already exists
  const existing = await prisma.trustEvent.findFirst({
    where: { relatedId: transactionId, eventType: 'TRANSACTION_SETTLED' }
  });
  if (existing) {
    console.log(`[EVENTS] Transaction settled event already processed for ${transactionId}`);
    return;
  }

  // Recalculate trust scores
  await calculateAndSaveTrustScore(farmerId, 'FARMER');
  await calculateAndSaveTrustScore(buyerId, 'BUYER');

  // Record trust events
  await recordTrustEvent({
    userId: farmerId,
    userType: 'FARMER',
    eventType: 'TRANSACTION_SETTLED',
    impact: 2,
    description: `Transaction ${reference} settled successfully`,
    relatedId: transactionId,
  });
  await recordTrustEvent({
    userId: buyerId,
    userType: 'BUYER',
    eventType: 'TRANSACTION_SETTLED',
    impact: 2,
    description: `Transaction ${reference} settled successfully`,
    relatedId: transactionId,
  });
}
