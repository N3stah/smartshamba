import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[MPESA] B2C Queue Timeout received:', JSON.stringify(payload));

    const result = payload.Result;
    if (!result) return NextResponse.json({ success: true });

    const conversationId = result.ConversationID;
    const originatorId = result.OriginatorConversationID;
    
    const payout = await prisma.b2CPayout.findFirst({
      where: { OR: [{ conversationId }, { originatorConversationID: originatorId }] },
    });

    if (payout) {
      await prisma.$transaction([
        prisma.b2CPayout.update({
          where: { id: payout.id },
          data: { status: 'FAILED', failureReason: 'Queue Timeout' }
        }),
        prisma.transaction.update({
          where: { id: payout.transactionId },
          data: { status: 'DELIVERED' } // Revert so they can try again
        })
      ]);
      console.warn(`[MPESA] B2C Queue Timeout for ConvID: ${conversationId}. Reverted transaction to DELIVERED.`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MPESA] B2C Queue error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ success: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'B2C Queue endpoint is active.' });
}
