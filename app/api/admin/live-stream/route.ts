import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let lastTimestamp = new Date(Date.now() - 60000); // Start 1 min ago

        const sendUpdates = async () => {
          try {
            const [newTx, newFarmers, newDisputes] = await Promise.all([
              prisma.transaction.findMany({ where: { createdAt: { gt: lastTimestamp } }, include: { farmer: true, buyer: true }, take: 5 }),
              prisma.farmer.findMany({ where: { createdAt: { gt: lastTimestamp } }, take: 5 }),
              prisma.dispute.findMany({ where: { createdAt: { gt: lastTimestamp } }, take: 5 })
            ]);

            const events = [
              ...newTx.map(t => ({ type: 'TRANSACTION', message: `New Tx: ${t.farmer?.name ?? 'Farmer'} sold ${t.quantityBags} bags to ${t.buyer?.name ?? 'Buyer'}` })),
              ...newFarmers.map(f => ({ type: 'FARMER_JOINED', message: `New Farmer Registered: ${f.name ?? 'Farmer'} from ${f.location ?? 'Kenya'}` })),
              ...newDisputes.map(d => ({ type: 'DISPUTE', message: `Dispute opened: ${d.reason}` }))
            ];

            if (events.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(events)}\n\n`));
              lastTimestamp = new Date();
            }
          } catch {
            // Keep stream alive even if DB query fails temporarily
          }
        };

        // Send immediately, then every 10 seconds
        await sendUpdates();
        const interval = setInterval(sendUpdates, 10000);

        // Clear interval on close (Note: Next.js handles this on req abort)
        req.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
