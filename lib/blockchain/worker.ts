import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { anchorBatch } from './provenance-service';
import { validateNetwork } from './config';

const POLL_INTERVAL_MS = 60000; // 1 minute
const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
let isProcessing = false; // Single-flight guard

async function discoverAndQueueAnchors() {
  try {
    const settledIndividual = await prisma.batchTransactionAllocation.findMany({
      where: {
        transaction: { status: 'SETTLED' },
        batch: { 
          dealEvidence: { isNot: null },
          provenanceAnchors: { none: {} } 
        }
      },
      select: { batchId: true }
    });

    const settledGroup = await prisma.batchGroupTransactionAllocation.findMany({
      where: {
        groupTransaction: { status: 'SETTLED' },
        batch: { 
          dealEvidence: { isNot: null },
          provenanceAnchors: { none: {} } 
        }
      },
      select: { batchId: true }
    });

    const batchIdsToQueue = [...new Set([...settledIndividual.map(a => a.batchId), ...settledGroup.map(a => a.batchId)])];

    for (const batchId of batchIdsToQueue) {
      const eventKey = `PROVENANCE_ANCHOR_REQUESTED:${batchId}`;
      await prisma.eventOutbox.upsert({
        where: { eventKey },
        update: {},
        create: {
          eventType: 'PROVENANCE_ANCHOR_REQUESTED',
          aggregateId: batchId,
          payload: { batchId },
          status: 'PENDING',
          eventKey,
        }
      });
    }
    if (batchIdsToQueue.length > 0) {
      console.log(`[WORKER] Queued ${batchIdsToQueue.length} batches for anchoring.`);
    }
  } catch (error) {
    console.error('[WORKER] Error during discovery phase:', error);
  }
}

async function processOutboxEvents() {
  try {
    const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);
    
    // Claim PENDING events or stale PROCESSING events (using processedAt as lease time)
    const targetEvent = await prisma.eventOutbox.findFirst({
      where: {
        eventType: 'PROVENANCE_ANCHOR_REQUESTED',
        OR: [
          { status: 'PENDING' },
          { status: 'PROCESSING', nextAttemptAt: { lt: staleThreshold } }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!targetEvent) return;

    // Atomically claim the event
    const claimed = await prisma.eventOutbox.updateMany({
      where: { 
        id: targetEvent.id, 
        status: targetEvent.status,
        nextAttemptAt: targetEvent.nextAttemptAt // Ensure it hasn't been updated
      },
      data: { status: 'PROCESSING', attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + 300000) }
    });

    if (claimed.count === 0) return;

    const batchId = (targetEvent.payload as any).batchId;

    try {
      await anchorBatch(batchId);
      await prisma.eventOutbox.update({
        where: { id: targetEvent.id },
        data: { status: 'PROCESSED', processedAt: new Date() }
      });
    } catch (error: any) {
      console.error(`[WORKER] Failed to anchor batch ${batchId}:`, error.message);
      // Revert to PENDING for retry, preserve processedAt as last attempt time
      await prisma.eventOutbox.update({
        where: { id: targetEvent.id },
        data: { status: 'PENDING', lastError: error.message }
      });
    }
  } catch (error) {
    console.error('[WORKER] Error processing outbox:', error);
  }
}

async function mainLoop() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    await discoverAndQueueAnchors();
    await processOutboxEvents();
  } finally {
    isProcessing = false;
  }
}

async function main() {
  console.log('[WORKER] Starting MavunoWise Provenance Worker...');
  
  await validateNetwork().catch(e => {
    console.error('[WORKER] Network validation failed. Please check RPC config and wallet funds.', e.message);
    process.exit(1);
  });

  console.log('[WORKER] Network validated. Starting polling loop...');
  await mainLoop();
  setInterval(mainLoop, POLL_INTERVAL_MS);
}

main();
