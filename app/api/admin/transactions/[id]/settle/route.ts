import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/auditLog';
import { publishEvent } from '@/lib/core/event-bus';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { mpesaRef, notifyFarmer = true } = body;

    if (!mpesaRef || typeof mpesaRef !== 'string' || mpesaRef.trim() === '') {
      return NextResponse.json(
        { error: 'mpesaRef is required for manual settlement' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { farmer: true, buyer: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status === 'SETTLED') {
      return NextResponse.json({ error: 'Transaction already settled' }, { status: 400 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status: 'SETTLED', mpesaRef: mpesaRef.trim() },
      include: { farmer: true, buyer: true },
    });

    await recordAuditLog({
      action: 'SETTLE_TRANSACTION',
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'Transaction',
      entityId: id,
      before: { status: transaction.status, mpesaRef: transaction.mpesaRef },
      after: { status: updated.status, mpesaRef: updated.mpesaRef },
    });

    console.log(`[ADMIN] Manually settled transaction ${updated.reference} with ref ${mpesaRef}`);

    // Publish event for trust recalculation (async)
    try {
      await publishEvent({
        eventType: 'TRANSACTION_SETTLED',
        aggregateId: updated.id,
        eventKey: `TRANSACTION_SETTLED:${updated.id}`,
        payload: {
          farmerId: updated.farmerId,
          buyerId: updated.buyerId,
          reference: updated.reference,
          transactionId: updated.id
        }
      });
    } catch (e) {
      console.error('[EVENTS] Failed to publish transaction settled event:', e);
    }

    // Publish event to notify farmer (async)
    if (notifyFarmer && updated.farmerId) {
      try {
        await publishEvent({
          eventType: 'NOTIFY_TRANSACTION_SETTLED',
          aggregateId: updated.id,
          eventKey: `NOTIFY_TRANSACTION_SETTLED:${updated.id}:FARMER_${updated.farmerId}`,
          payload: {
            recipientType: 'FARMER',
            recipientId: updated.farmerId,
            notificationType: 'SETTLEMENT',
            context: { reference: updated.reference, totalValue: updated.totalValue, mpesaRef: mpesaRef.trim() }
          }
        });
      } catch (e) {
        console.error('[EVENTS] Failed to publish settlement notification:', e);
      }
    }

    return NextResponse.json({ transaction: updated });
  } catch (error) {
    console.error('[ADMIN] Manual settlement error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
