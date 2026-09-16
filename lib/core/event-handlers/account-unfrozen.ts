import { EventOutbox } from '@prisma/client';

export async function handleAccountUnfrozen(event: EventOutbox): Promise<void> {
  const { userId, reason } = event.payload as { userId: string; reason: string };
  console.log(`[EVENTS] Account ${userId} unfrozen. Reason: ${reason}`);
  // Placeholder for future side effects.
}
