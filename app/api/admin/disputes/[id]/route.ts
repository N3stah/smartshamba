import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';
import { DisputeStatus, Prisma } from '@prisma/client';
import { recordAuditLog } from '@/lib/auditLog';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const { status, adminNote } = await req.json();

    const validStatuses: DisputeStatus[] = [
      'OPEN',
      'UNDER_REVIEW',
      'RESOLVED',
      'CLOSED',
    ];

    if (!validStatuses.includes(status)) {
      console.error('[DISPUTES] Invalid status', status);
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      select: { id: true, transactionId: true, status: true, adminNote: true, farmerId: true, buyerId: true },
    });

    if (!dispute) {
      console.error('[DISPUTES] Dispute not found', id);
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const isTerminal = status === 'RESOLVED' || status === 'CLOSED';

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.dispute.update({
        where: { id },
        data: {
          status,
          adminNote: adminNote ?? null,
          ...(isTerminal ? { resolvedAt: new Date() } : {}),
        },
      }),
    ];

    if (isTerminal) {
      ops.push(
        prisma.transaction.update({
          where: { id: dispute.transactionId },
          data: { status: 'SETTLED' },
        })
      );
    }

    await prisma.$transaction(ops);

    // Trigger Trust Recalculation & Event on Resolution
    if (isTerminal) {
      try {
        await calculateAndSaveTrustScore(dispute.farmerId, 'FARMER');
        await calculateAndSaveTrustScore(dispute.buyerId, 'BUYER');
        await recordTrustEvent({
          userId: dispute.farmerId,
          userType: 'FARMER',
          eventType: 'DISPUTE_RESOLVED',
          impact: -5,
          description: `Dispute resolved/closed for transaction \${dispute.transactionId}`,
          relatedId: dispute.id,
        });
        await recordTrustEvent({
          userId: dispute.buyerId,
          userType: 'BUYER',
          eventType: 'DISPUTE_RESOLVED',
          impact: -5,
          description: `Dispute resolved/closed for transaction \${dispute.transactionId}`,
          relatedId: dispute.id,
        });
      } catch (e) {
        console.error('[TRUST] Failed to process dispute resolution:', e);
      }
    }

    await recordAuditLog({
      action: 'UPDATE_DISPUTE_STATUS',
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'Dispute',
      entityId: id,
      before: { status: dispute.status, adminNote: dispute.adminNote },
      after: { status, adminNote: adminNote ?? null },
    });

    console.log('[DISPUTES] Updated dispute', id, 'to', status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DISPUTES] PATCH error', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
