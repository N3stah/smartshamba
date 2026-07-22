import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';
import { DisputeStatus, Prisma } from '@prisma/client';
import { recordAuditLog } from '@/lib/auditLog';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(req);
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
      select: { transactionId: true, status: true, adminNote: true },
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
