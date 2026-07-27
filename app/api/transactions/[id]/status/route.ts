import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { recordAuditLog } from '@/lib/auditLog';
import { sendB2CPayout } from '@/lib/mpesa';
import * as Sentry from '@sentry/nextjs';

const validTransitions: Record<string, string[]> = {
  PENDING: ['AGREED', 'DISPUTED'],
  AGREED: ['DELIVERY_SCHEDULED', 'DISPUTED'],
  DELIVERY_SCHEDULED: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['SETTLING', 'DISPUTED'], // Changed to SETTLING
  SETTLING: ['SETTLED', 'DELIVERED'], // Allow revert if B2C fails immediately, or Admin Force Settle
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

    const allowedNext = validTransitions[transaction.status] || [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json({ error: `Invalid transition from ${transaction.status} to ${status}` }, { status: 400 });
    }

    // Role-based authorization for specific transitions
    if (status === 'DELIVERED' && !farmerPhone && !isAdmin) {
      return NextResponse.json({ error: 'Only the farmer can mark as delivered' }, { status: 403 });
    }
    if (status === 'SETTLING' && !buyerPhone && !isAdmin) {
      return NextResponse.json({ error: 'Only the buyer can initiate payment' }, { status: 403 });
    }
    if (status === 'SETTLED' && transaction.status === 'SETTLING' && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can manually force settle' }, { status: 403 });
    }

    const dataToUpdate: any = { status };
    if (fulfillmentData) {
      if (fulfillmentData.deliveryMethod) dataToUpdate.deliveryMethod = fulfillmentData.deliveryMethod;
      if (fulfillmentData.deliveryLocation) dataToUpdate.deliveryLocation = fulfillmentData.deliveryLocation;
      if (fulfillmentData.fulfillmentNotes) dataToUpdate.fulfillmentNotes = fulfillmentData.fulfillmentNotes;
      if (fulfillmentData.scheduledDate) {
        const parsedDate = new Date(fulfillmentData.scheduledDate);
        if (!isNaN(parsedDate.getTime())) {
          dataToUpdate.scheduledDate = parsedDate;
        }
      }
    }

    // ─── B2C Disbursement Logic ──────────────────────────────────────────
    if (status === 'SETTLING') {
      const PLATFORM_FEE_RATE = 0.02; // 2% fee
      const platformFee = transaction.totalValue * PLATFORM_FEE_RATE;
      const payoutAmount = transaction.totalValue - platformFee;
      
      dataToUpdate.platformFee = platformFee;

      // Initiate B2C
      const b2cResult = await sendB2CPayout(transaction.farmer.phone, payoutAmount, transaction.reference);
      
      if (b2cResult.success && b2cResult.conversationId) {
        dataToUpdate.b2cRef = b2cResult.conversationId;
        
        // Create B2C Payout record
        await prisma.b2CPayout.create({
          data: {
            transactionId: transaction.id,
            conversationId: b2cResult.conversationId,
            amount: payoutAmount,
            status: 'PENDING'
          }
        });
      } else {
        // If B2C fails immediately (e.g., wrong number format), revert status
        return NextResponse.json({ error: `Failed to initiate M-PESA payment: ${b2cResult.error}` }, { status: 400 });
      }
    }

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: dataToUpdate,
    });

    // Notify the other party
    const recipientPhone = farmerPhone ? transaction.buyer.phone : transaction.farmer.phone;
    if (recipientPhone && status !== 'SETTLING') { // Don't send generic SMS for SETTLING, B2C callback will handle it
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone,
        body: `SmartShamba: Transaction ${transaction.reference} status updated to ${status.replace(/_/g, ' ')}. Check your dashboard.`,
        farmerId: buyerPhone ? transaction.farmer.id : undefined,
        buyerId: farmerPhone ? transaction.buyer.id : undefined,
      }).catch(err => console.error('[NOTIFICATIONS] Failed:', err));
    }

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
