import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

/**
 * V2.1 Architecture: Transactional Outbox Pattern
 * Instead of emitting to memory (which dies on serverless), we write events 
 * to the database within the same transaction as the business logic.
 * A cron job then reliably publishes them.
 */
export class EventBus {
  async emit(eventType: string, aggregateId: string, payload: any, tx?: any) {
    const client = tx || prisma;
    try {
      await client.eventOutbox.create({
        data: {
          eventType,
          aggregateId,
          payload,
          status: 'PENDING'
        }
      });
      console.log(`[Outbox] Event queued: ${eventType} for ${aggregateId}`);
    } catch (error) {
      Sentry.captureException(error);
      throw error; // Let the calling transaction rollback
    }
  }
}

export const eventBus = new EventBus();
