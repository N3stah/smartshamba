import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

/**
 * Publishes an event to the transactional outbox.
 * 
 * CRITICAL: When called with a `tx` (Prisma Transaction Client), the event
 * is written within the same database transaction as the domain state change.
 * This guarantees the event is persisted atomically with the business operation.
 * 
 * If called without `tx`, it writes in a new independent transaction.
 * 
 * Producer-side idempotency is provided via `eventKey`.
 * If an event with the same key already exists, it is silently ignored.
 */
export async function publishEvent(params: {
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  eventKey?: string; // e.g., "TRANSACTION_SETTLED:tx_123"
  version?: number;  // Defaults to 1
  tx?: Prisma.TransactionClient; // Optional transaction client
}): Promise<void> {
  try {
    const client = params.tx || prisma;
    
    const data: Prisma.EventOutboxUncheckedCreateInput = {
      eventType: params.eventType,
      aggregateId: params.aggregateId,
      payload: params.payload as unknown as Prisma.InputJsonValue,
      status: 'PENDING',
      eventKey: params.eventKey || null,
      version: params.version || 1,
    };

    // If eventKey is provided, use upsert to guarantee idempotency
    // If the key already exists, we do nothing (update with same data)
    if (params.eventKey) {
      await client.eventOutbox.upsert({
        where: { eventKey: params.eventKey },
        update: {}, // Do nothing if it already exists
        create: data,
      });
    } else {
      await client.eventOutbox.create({ data });
    }
  } catch (error) {
    // If it's a unique constraint violation on eventKey, that's fine - idempotent
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.log(`[EVENTS] Event already published for key: ${params.eventKey}`);
      return;
    }
    console.error('[EVENTS] Failed to publish event:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error;
  }
}
