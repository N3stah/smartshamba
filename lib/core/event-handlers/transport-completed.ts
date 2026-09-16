import { EventOutbox } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

export async function handleTransportCompleted(event: EventOutbox): Promise<void> {
  const { providerId, bookingId } = event.payload as {
    providerId: string;
    bookingId: string;
  };

  // Idempotency: Check if a TrustEvent for this booking already exists
  const existing = await prisma.trustEvent.findFirst({
    where: { relatedId: bookingId, eventType: 'TRANSPORT_COMPLETED' }
  });
  if (existing) {
    console.log(`[EVENTS] Transport completed event already processed for ${bookingId}`);
    return;
  }

  await calculateAndSaveTrustScore(providerId, 'TRANSPORT');
  await recordTrustEvent({
    userId: providerId,
    userType: 'TRANSPORT',
    eventType: 'TRANSPORT_COMPLETED',
    impact: 2,
    description: `Transport booking ${bookingId.substring(0, 8)} completed successfully`,
    relatedId: bookingId,
  });
}
