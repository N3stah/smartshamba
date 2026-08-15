import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
        // Use findFirst because reference might not be uniquely constrained in the schema
        const existing = await prisma.ledgerEntry.findFirst({
          where: { reference: `MPESA-${event.aggregateId}` }
        });
        
        if (!existing) {
          await prisma.ledgerEntry.create({
            data: {
              userId: event.payload.userId,
              userType: event.payload.userType,
              entryType: 'CREDIT',
              amount: event.payload.amount,
              reference: `MPESA-${event.aggregateId}`,
              description: 'Automated M-PESA Payment'
            }
          });
        }
      }
      break;
  }
}

async function sendNotification(phone: string, message: string) {
  console.log(`[NOTIFICATION] To: ${phone}, Msg: ${message}`);
}
