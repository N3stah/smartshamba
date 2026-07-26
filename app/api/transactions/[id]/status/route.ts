import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { recordAuditLog } from '@/lib/auditLog';
import * as Sentry from '@sentry/nextjs';

// Allowed state transitions
const validTransitions: Record<string, string[]> = {
  PENDING: ['AGREED', 'DISPUTED'],
  AGREED: ['DELIVERY_SCHEDULED', 'DISPUTED'],
  DELIVERY_SCHEDULED: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['SETTLED', 'DISPUTED'],
  SETTLED: ['CLOSED'],
  CLOSED: [],
  DISPUTED: ['AGREED', 'CLOSED'],
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: transactionId } = await params;
    const body = await req.json();
    const { status, fulfillmentData } = body;

    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    const isAdmin = !requireAdminAuth(req);

    if (!farmerPhone && !buyerPhone && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { farmer: true, buyer: true },
    });

    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // Validate transition
    const allowedNext = validTransitions[transaction.status] || [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json({ error: `Invalid transition from ${transaction.status} to ${status}` }, { status: 400 });
    }

    // Role-based authorization for specific transitions
    if (status === 'DELIVERED' && !farmerPhone && !isAdmin) {
      return NextResponse.json({ error: 'Only the farmer can mark as delivered' }, { status: 403 });
    }
    if (status === 'SETTLED' && !buyerPhone && !isAdmin) {
      return NextResponse.json({ error: 'Only the buyer can confirm payment' }, { status: 403 });
    }

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        ...fulfillmentData,
      },
    });

    // Notify the other party
    const recipientPhone = farmerPhone ? transaction.buyer.phone : transaction.farmer.phone;
    if (recipientPhone) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone,
        body: `SmartShamba: Transaction ${transaction.reference} status updated to ${status}. Check your dashboard.`,
        farmerId: buyerPhone ? transaction.farmer.id : undefined,
        buyerId: farmerPhone ? transaction.buyer.id : undefined,
      }).catch(err => console.error('[NOTIFICATIONS] Failed:', err));
    }

    // Audit Log
    await recordAuditLog({
      action: `UPDATE_TX_STATUS_${status}`,
      actorType: isAdmin ? 'ADMIN' : 'SYSTEM',
      actorId: farmerPhone || buyerPhone || 'admin',
      entityType: 'Transaction',
      entityId: transactionId,
      before: { status: transaction.status },
      after: { status },
    });

    return NextResponse.json({ success: true, transaction: updatedTx });
  } catch (error) {
    console.error('[API] Error updating transaction status:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
