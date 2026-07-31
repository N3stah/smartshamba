import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeTransaction } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id: demandId } = await params;
    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const demand = await prisma.buyerDemand.findUnique({ where: { id: demandId } });
    if (!demand || demand.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This demand is no longer active.' }, { status: 400 });
    }

    const reference = `SS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Use safeTransaction to prevent hanging DB operations
    const transaction = await safeTransaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          reference,
          farmerId: farmer.id,
          buyerId: demand.buyerId,
          buyerDemandId: demand.id,
          quantityBags: demand.quantityBags,
          pricePerBag: 0, // Price to be negotiated/settled later
          totalValue: 0,
          status: 'PENDING',
        },
      });
      
      await tx.buyerDemand.update({
        where: { id: demandId },
        data: { status: 'CLOSED' },
      });
      
      return newTx;
    });

    // Notify the buyer
    const buyer = await prisma.buyer.findUnique({ where: { id: demand.buyerId } });
    if (buyer && buyer.phone) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: buyer.phone,
        body: `SmartShamba: Farmer ${farmer.name ?? 'A farmer'} has accepted your demand for ${demand.product}. Ref: ${reference}. Check your web dashboard.`,
        buyerId: buyer.id,
      }).catch(err => console.error('[NOTIFICATIONS] Failed to send buyer notification:', err));
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('[API] Accept demand error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
