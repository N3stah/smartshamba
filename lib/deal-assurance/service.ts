import { prisma } from '@/lib/prisma';
import { EvidenceInput, EvidenceRecord } from './types';
import { generateEvidenceHash } from './hashing';
import * as Sentry from '@sentry/nextjs';

export async function captureEvidence(input: EvidenceInput, providerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify the transport booking exists and belongs to the provider
    const booking = await prisma.transportBooking.findUnique({
      where: { id: input.bookingId },
      include: {
        transaction: true,
        groupTransaction: true,
      }
    });

    if (!booking) {
      return { success: false, error: 'Transport booking not found.' };
    }

    if (booking.providerId !== providerId) {
      return { success: false, error: 'Unauthorized: This booking belongs to another provider.' };
    }

    if (booking.status !== 'IN_TRANSIT' && booking.status !== 'DELIVERED') {
      return { success: false, error: `Evidence cannot be captured for booking with status ${booking.status}.` };
    }

    // 2. Find the associated FarmBatch
    let batchId: string | null = null;

    if (booking.transactionId) {
      // Use findFirst because @@unique([batchId, transactionId]) means transactionId alone isn't a unique selector
      const allocation = await prisma.batchTransactionAllocation.findFirst({
        where: { transactionId: booking.transactionId }
      });
      if (allocation) batchId = allocation.batchId;
    } else if (booking.groupTransactionId) {
      const allocation = await prisma.batchGroupTransactionAllocation.findFirst({
        where: { groupTransactionId: booking.groupTransactionId }
      });
      if (allocation) batchId = allocation.batchId;
    }

    if (!batchId) {
      return { success: false, error: 'No associated farm batch found for this transaction.' };
    }

    const batch = await prisma.farmBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return { success: false, error: 'Farm batch record not found.' };
    }

    // 3. Prepare Evidence Record
    const evidenceRecord: EvidenceRecord = {
      batchId: batch.id,
      photoRef: input.photoRef || null,
      weightKg: input.weightKg ?? null,
      moistureLevel: input.moistureLevel ?? null,
      qualityNote: input.qualityNote || null,
      capturedBy: providerId,
      capturedAt: new Date().toISOString(),
    };

    const evidenceHash = generateEvidenceHash(evidenceRecord);

    // 4. Persist Evidence (Upsert because DealEvidence has a unique batchId)
    await prisma.dealEvidence.upsert({
      where: { batchId: batch.id },
      update: {
        photoRef: evidenceRecord.photoRef,
        weightKg: evidenceRecord.weightKg,
        moistureLevel: evidenceRecord.moistureLevel,
        qualityNote: evidenceRecord.qualityNote,
        capturedBy: providerId,
        capturedAt: new Date(),
        evidenceHash: evidenceHash,
      },
      create: {
        batchId: batch.id,
        photoRef: evidenceRecord.photoRef,
        weightKg: evidenceRecord.weightKg,
        moistureLevel: evidenceRecord.moistureLevel,
        qualityNote: evidenceRecord.qualityNote,
        capturedBy: providerId,
        evidenceHash: evidenceHash,
      }
    });

    // 5. Queue Provenance Anchoring via EventOutbox
    const eventKey = `PROVENANCE_ANCHOR_REQUESTED:${batch.id}`;
    await prisma.eventOutbox.upsert({
      where: { eventKey },
      update: {}, // No update if it exists
      create: {
        eventType: 'PROVENANCE_ANCHOR_REQUESTED',
        aggregateId: batch.id,
        payload: { batchId: batch.id },
        status: 'PENDING',
        eventKey,
      }
    });

    // 6. Create DeliveryEvent
    await prisma.deliveryEvent.create({
      data: {
        bookingId: booking.id,
        eventType: 'EVIDENCE_CAPTURED',
        notes: `Evidence captured. Weight: ${input.weightKg || 'N/A'}kg, Moisture: ${input.moistureLevel || 'N/A'}%`,
      }
    });

    return { success: true };

  } catch (error: any) {
    console.error('[DEAL ASSURANCE] Error capturing evidence:', error);
    Sentry.captureException(error);
    return { success: false, error: 'Internal server error while capturing evidence.' };
  }
}
