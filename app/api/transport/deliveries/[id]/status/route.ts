import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status, lat, lng, note, podSignature } = await req.json();

    const booking = await prisma.transportBooking.findUnique({
      where: { id },
      include: { provider: true, transaction: { include: { farmer: true, buyer: true } } }
    });

    if (!booking || booking.provider.phone !== phone) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 });
    }

    // Update booking status
    const updatedBooking = await prisma.transportBooking.update({
      where: { id },
      data: { 
        status,
        ...(status === 'DELIVERED' ? { deliveredAt: new Date(), podSignature: podSignature || null } : {})
      }
    });

    // Create timeline event
    await prisma.deliveryEvent.create({
      data: {
        bookingId: id,
        status,
        latitude: lat,
        longitude: lng,
        note: note || `Status updated to ${status}`
      }
    });

    // Notify Farmer and Buyer
    if (booking.transaction) {
      const msg = `SmartShamba Logistics: Delivery ${booking.id.substring(0,8)} status updated to ${status}.`;
      if (booking.transaction.farmer?.phone) {
        await sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: booking.transaction.farmer.phone, body: msg, farmerId: booking.transaction.farmer.id }).catch(()=>{});
      }
      if (booking.transaction.buyer?.phone) {
        await sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: booking.transaction.buyer.phone, body: msg, buyerId: booking.transaction.buyer.id }).catch(()=>{});
      }
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('[API] Update delivery status error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
