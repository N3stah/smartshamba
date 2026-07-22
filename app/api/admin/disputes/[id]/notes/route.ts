import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/auditLog';
import * as Sentry from '@sentry/nextjs';

/**
 * POST: Add internal admin notes to a dispute (without changing dispute status)
 * This enables escalated dispute handling - admins can add investigation notes
 * without resolving or closing the dispute.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { id: disputeId } = await params;
    const body = await req.json();
    const { notes } = body;

    if (typeof notes !== 'string' || notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Notes cannot be empty' },
        { status: 400 }
      );
    }

    const existingDispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { adminNotes: true, transactionId: true },
    });

    if (!existingDispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: { adminNotes: notes.trim() },
    });

    await recordAuditLog({
      action: 'ADD_DISPUTE_NOTES',
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'Dispute',
      entityId: disputeId,
      before: { adminNotes: existingDispute.adminNotes },
      after: { adminNotes: updatedDispute.adminNotes },
    });

    console.log(`[DISPUTES] Admin notes added to dispute ${disputeId}`);

    return NextResponse.json({
      message: 'Notes added successfully',
      dispute: updatedDispute,
    });
  } catch (error) {
    console.error('[DISPUTES] Error adding notes:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
