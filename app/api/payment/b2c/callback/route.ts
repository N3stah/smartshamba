import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[MPESA] B2C Callback received:', JSON.stringify(payload));

    const result = payload.Result;
    if (!result) return NextResponse.json({ success: true });

    const conversationId = result.ConversationID;
    const originatorId = result.OriginatorConversationID;
    
    // Find the payout record
    const payout = await prisma.b2CPayout.findFirst({
      where: { OR: [{ conversationId }, { originatorConversationID: originatorId }] },
      include: { transaction: { include: { farmer: true, buyer: true } } }
    });

    if (!payout) {
      console.error('[MPESA] B2C Payout record not found for ConvID:', conversationId);
      return NextResponse.json({ success: true });
    }

    if (result.ResultCode === 0) {
      // Success
      const mpesaRef = result.TransactionID || '';
      
      await prisma.$transaction([
        prisma.b2CPayout.update({
          where: { id: payout.id },
          data: { status: 'SUCCESS', mpesaRef }
        }),
        prisma.transaction.update({
          where: { id: payout.transactionId },
          data: { status: 'SETTLED', mpesaRef }
        })
      ]);

      // Notify Farmer
      if (payout.transaction.farmer?.phone) {
        await sendNotification({
          type: 'SETTLEMENT',
          recipientPhone: payout.transaction.farmer.phone,
          body: `SmartShamba: Payment received! KSh ${payout.amount} has been sent to your M-PESA. Ref: ${mpesaRef}. Platform fee deducted.`,
          farmerId: payout.transaction.farmer.id,
        }).catch(err => console.error('[MPESA] SMS failed:', err));
      }
    } else {
      // Failed
      const reason = result.ResultDesc || 'Unknown error';
      
      await prisma.$transaction([
        prisma.b2CPayout.update({
          where: { id: payout.id },
          data: { status: 'FAILED', failureReason: reason }
        }),
        prisma.transaction.update({
          where: { id: payout.transactionId },
          data: { status: 'DELIVERED' } // Revert to DELIVERED so they can try again
        })
      ]);

      // Alert Admin (simplified for now, could use Sentry or email)
      console.error(`[MPESA] B2C FAILED for Tx ${payout.transaction.reference}: ${reason}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MPESA] B2C Callback error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ success: true });
  }
}
