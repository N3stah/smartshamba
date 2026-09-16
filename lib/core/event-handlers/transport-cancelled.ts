import { EventOutbox } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

export async function handleTransportCancelled(event: EventOutbox): Promise<void> {
  const { providerId, bookingId } = event.payload as {
    providerId: string;
    bookingId: string;
  };

  // Idempotency check
  const existing = await prisma.trustEvent.findFirst({
    where: { relatedId: bookingId, eventType: 'TRANSPORT_CANCELLED' }
  });
  if (existing) {
    console.log(`[EVENTS] Transport cancelled event already processed for ${bookingId}`);
    return;
  }

  await calculateAndSaveTrustScore(providerId, 'TRANSPORT');
  await recordTrustEvent({
    userId: providerId,
    userType: 'TRANSPORT',
    eventType: 'TRANSPORT_CANCELLED',
    impact: -3,
    description: `Transport booking ${bookingId.substring(0, 8)} was cancelled`,
    relatedId: bookingId,
  });
}
