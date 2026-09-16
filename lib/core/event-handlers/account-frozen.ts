import { EventOutbox } from '@prisma/client';

export async function handleAccountFrozen(event: EventOutbox): Promise<void> {
  const { userId, score } = event.payload as { userId: string; score: number };
  console.log(`[EVENTS] Account ${userId} frozen due to low trust score (${score})`);
  // The freeze itself is already applied synchronously by the reputation service.
  // This handler is a placeholder for future side effects (e.g., admin notification).
}
