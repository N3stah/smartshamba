import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchEvent } from '@/lib/core/event-handlers';
import * as Sentry from '@sentry/nextjs';

const MAX_ATTEMPTS = 5;
const STALE_PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 10;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[EVENTS] Processing outbox...');

    // 1. Recover stale PROCESSING events (crashed workers)
    const staleThreshold = new Date(Date.now() - STALE_PROCESSING_TIMEOUT_MS);
    const recovered = await prisma.eventOutbox.updateMany({
      where: {
        status: 'PROCESSING',
        // nextAttemptAt is used as a lease timestamp for PROCESSING events
        nextAttemptAt: { lt: staleThreshold }
      },
      data: {
        status: 'PENDING',
        nextAttemptAt: null
      }
    });
    if (recovered.count > 0) {
      console.log(`[EVENTS] Recovered ${recovered.count} stale PROCESSING events`);
    }

    // 2. Fetch PENDING events ready for processing
    const events = await prisma.eventOutbox.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE
    });

    let processedCount = 0;
    let failedCount = 0;

    for (const event of events) {
      // 3. Atomically claim the event
      const claimed = await prisma.eventOutbox.updateMany({
        where: { id: event.id, status: 'PENDING' },
        data: { 
          status: 'PROCESSING',
          nextAttemptAt: new Date() // Lease timestamp
        }
      });

      if (claimed.count === 0) {
        // Another processor beat us to it
        continue;
      }

      try {
        // 4. Dispatch to handler
        await dispatchEvent(event);

        // 5. Mark as PROCESSED
        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            nextAttemptAt: null
          }
        });
        processedCount++;
        console.log(`[EVENTS] Processed ${event.eventType} (${event.id.substring(0, 8)})`);
      } catch (error) {
        // 6. Handle failure with retry logic
        const attempts = event.attempts + 1;
        const isFinalFailure = attempts >= MAX_ATTEMPTS;

        // Calculate exponential backoff: 1s, 2s, 4s, 8s, 16s
        const backoffMs = Math.pow(2, attempts - 1) * 1000;
        const nextAttemptAt = isFinalFailure ? null : new Date(Date.now() + backoffMs);

        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: {
            status: isFinalFailure ? 'FAILED' : 'PENDING',
            attempts,
            lastError: (error as Error).message?.substring(0, 500) || 'Unknown error',
            nextAttemptAt
          }
        });

        if (isFinalFailure) {
          console.error(`[EVENTS] Event ${event.id} FAILED permanently after ${attempts} attempts`);
          Sentry.captureException(error, {
            tags: { event_id: event.id, event_type: event.eventType, final_failure: 'true' }
          });
          failedCount++;
        } else {
          console.warn(`[EVENTS] Event ${event.id} failed (attempt ${attempts}), retrying in ${backoffMs}ms`);
          Sentry.captureException(error, {
            tags: { event_id: event.id, event_type: event.eventType, attempt: String(attempts) }
          });
        }
      }
    }

    // 7. Return metrics
    const metrics = await prisma.eventOutbox.groupBy({
      by: ['status'],
      _count: { id: true },
      _max: { createdAt: true },
      _avg: { attempts: true }
    });

    console.log(`[EVENTS] Processing complete. Processed: ${processedCount}, Failed: ${failedCount}`);
    return NextResponse.json({
      success: true,
      processed: processedCount,
      failed: failedCount,
      metrics: metrics.map(m => ({
        status: m.status,
        count: m._count.id,
        oldest: m._max.createdAt,
        avgAttempts: m._avg.attempts
      }))
    });
  } catch (error) {
    console.error('[EVENTS] Outbox processor error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
