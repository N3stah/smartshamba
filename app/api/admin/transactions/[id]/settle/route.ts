import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { settlementTemplate } from '@/lib/notifications/templates';
import { recordAuditLog } from '@/lib/auditLog';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

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

    // Trigger Trust Recalculation & Event
    try {
      await calculateAndSaveTrustScore(updated.farmerId, 'FARMER');
      await calculateAndSaveTrustScore(updated.buyerId, 'BUYER');
      await recordTrustEvent({
        userId: updated.farmerId,
        userType: 'FARMER',
        eventType: 'TRANSACTION_SETTLED',
        impact: 2,
        description: `Transaction \${updated.reference} settled successfully`,
        relatedId: updated.id,
      });
      await recordTrustEvent({
        userId: updated.buyerId,
        userType: 'BUYER',
        eventType: 'TRANSACTION_SETTLED',
        impact: 2,
        description: `Transaction \${updated.reference} settled successfully`,
        relatedId: updated.id,
      });
    } catch (e) {
      console.error('[TRUST] Failed to process settlement event:', e);
    }

    let smsResult = null;
    if (notifyFarmer && updated.farmer?.phone) {
      const smsBody = settlementTemplate({
        reference:  updated.reference,
        buyerName:  updated.buyer.name,
        totalValue: updated.totalValue,
        mpesaRef:   mpesaRef.trim(),
      });
      smsResult = await sendNotification({
        type:           'SETTLEMENT',
        recipientPhone: updated.farmer.phone,
        body:           smsBody,
        farmerId:       updated.farmer.id,
      });
    }

    return NextResponse.json({ transaction: updated, smsResult });
  } catch (error) {
    console.error('[ADMIN] Manual settlement error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
