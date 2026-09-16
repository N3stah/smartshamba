import { EventOutbox } from '@prisma/client';
import { handleTransactionSettled } from './transaction-settled';
import { handleTransportCompleted } from './transport-completed';
import { handleTransportCancelled } from './transport-cancelled';
import { handleRatingReceived } from './rating-received';
import { handleDisputeOpened } from './dispute-opened';
import { handleDisputeResolved } from './dispute-resolved';
import { handleAccountFrozen } from './account-frozen';
import { handleAccountUnfrozen } from './account-unfrozen';

export type EventHandler = (event: EventOutbox) => Promise<void>;

/**
 * Canonical event handler registry.
 * Maps event types to their handlers.
 * 
 * Each handler MUST be idempotent. The transactional outbox provides
 * at-least-once delivery, so the same event may be delivered more than once.
 */
const handlers: Record<string, EventHandler> = {
  TRANSACTION_SETTLED: handleTransactionSettled,
  TRANSPORT_COMPLETED: handleTransportCompleted,
  TRANSPORT_CANCELLED: handleTransportCancelled,
  RATING_RECEIVED: handleRatingReceived,
  DISPUTE_OPENED: handleDisputeOpened,
  DISPUTE_RESOLVED: handleDisputeResolved,
  ACCOUNT_FROZEN: handleAccountFrozen,
  ACCOUNT_UNFROZEN: handleAccountUnfrozen,
};

/**
 * Dispatches an event to its registered handler.
 * Throws if no handler is registered for the event type.
 */
export async function dispatchEvent(event: EventOutbox): Promise<void> {
  const handler = handlers[event.eventType];
  if (!handler) {
    throw new Error(`No handler registered for event type: ${event.eventType}`);
  }
  await handler(event);
}

/**
 * Returns all registered event types.
 * Useful for admin/monitoring dashboards.
 */
export function getRegisteredEventTypes(): string[] {
  return Object.keys(handlers);
}
