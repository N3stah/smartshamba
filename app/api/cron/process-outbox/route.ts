import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { postLedgerEntry, getOrCreateWalletId } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

interface OutboxEvent {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: {
    recipientPhone?: string;
    adverseOutcome?: boolean;
    atFaultUserId?: string;
    userId?: string;
    userType?: string;
    amount?: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingEvents = await prisma.eventOutbox.findMany({
      where: { status: 'PENDING', attempts: { lt: 5 } },
      take: 50,
      orderBy: { createdAt: 'asc' }
    });

    for (const event of pendingEvents) {
      try {
        const typedEvent = event as unknown as OutboxEvent;
        await routeEvent(typedEvent);
        
        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: { status: 'PROCESSED', processedAt: new Date() }
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: { attempts: { increment: 1 }, lastError: errorMessage }
        });
        Sentry.captureException(error);
      }
    }

    return NextResponse.json({ processed: pendingEvents.length });
  } catch (error) {
    console.error('[CRON] Process outbox error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function routeEvent(event: OutboxEvent) {
  switch(event.eventType) {
    case 'DisputeOpened':
      if (event.payload.recipientPhone) {
        await sendNotification(event.payload.recipientPhone, `A dispute has been opened for transaction ${event.aggregateId}. Our team will review.`);
      }
      break;
      
    case 'DisputeResolved':
      if (event.payload.adverseOutcome && event.payload.atFaultUserId) {
        await prisma.trustScore.updateMany({
          where: { userId: event.payload.atFaultUserId },
          data: { score: { decrement: 15 } }
        });
      }
      break;

    case 'PaymentReceived':
      if (event.payload.userId && event.payload.userType && event.payload.amount) {
        // Check if ledger entry already exists for this payment
        const existing = await prisma.ledgerEntry.findFirst({
          where: { reference: `MPESA-${event.aggregateId}` }
        });
        
        if (!existing) {
          // Use the wallet system to post the payment
          const walletId = await getOrCreateWalletId(event.payload.userId, event.payload.userType);
          await postLedgerEntry({
            walletId,
            type: 'CREDIT',
            amount: event.payload.amount,
            description: 'Automated M-PESA Payment',
            reference: `MPESA-${event.aggregateId}`
          });
        }
      }
      break;
  }
}

async function sendNotification(phone: string, message: string) {
  console.log(`[NOTIFICATION] To: ${phone}, Msg: ${message}`);
}
