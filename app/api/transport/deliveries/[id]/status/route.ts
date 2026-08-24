import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const body = await req.json();
    const { status, notes, location } = body;

    const booking = await prisma.transportBooking.findUnique({
      where: { id },
      include: { provider: true }
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.providerId !== provider.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updatedBooking = await prisma.transportBooking.update({
      where: { id },
      data: { status }
    });

    await prisma.deliveryEvent.create({
      data: {
        bookingId: id,
        eventType: status,
        notes: notes || `Status updated to ${status}`,
        location: location || null
      }
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('[API] Delivery status update error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
