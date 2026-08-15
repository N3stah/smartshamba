import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeTransaction } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const phone = getBuyerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id: listingId } = await params;
    const buyer = await prisma.buyer.findFirst({ where: { phone } });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const listing = await prisma.produceListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This produce is no longer available.' }, { status: 400 });
    }

    const reference = `SS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Use safeTransaction to prevent hanging DB operations
    const transaction = await safeTransaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          reference,
          farmerId: listing.farmerId,
          buyerId: buyer.id,
          produceListingId: listing.id,
          quantityBags: listing.quantityBags,
          pricePerBag: listing.pricePerBag,
          totalValue: listing.quantityBags * listing.pricePerBag,
          status: 'PENDING',
        },
      });
      
      await tx.produceListing.update({
        where: { id: listingId },
        data: { status: 'CLOSED' },
      });
      
      return newTx;
    });

    // Notify the farmer
    const farmer = await prisma.farmer.findUnique({ where: { id: listing.farmerId } });
    if (farmer) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: farmer.phone,
        body: `SmartShamba: Buyer ${buyer.name} has initiated a transaction for your ${listing.product}. Ref: ${reference}. Check your web dashboard.`,
        farmerId: farmer.id,
      }).catch(err => console.error('[NOTIFICATIONS] Failed to send farmer notification:', err));
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('[API] Initiate transaction error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
