import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import { processTransportSettlement, processGroupTransportSettlement } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

const validTransitions: Record<string, string[]> = {
  'ACCEPTED': ['LOADED'],
  'LOADED': ['IN_TRANSIT'],
  'IN_TRANSIT': ['DELIVERED'],
  'DELIVERED': ['COMPLETED'],
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const body = await req.json();
    const { status: newStatus, notes, location } = body;

    const booking = await prisma.transportBooking.findUnique({
      where: { id },
      include: { vehicle: true }
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.providerId !== provider.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Weather Hold Protection
    if (newStatus === 'COMPLETED' && booking.isHalted) {
      return NextResponse.json({ error: 'Cannot complete delivery while transport is halted due to weather.' }, { status: 400 });
    }

    // State Transition Validation
    const allowedNextStatuses = validTransitions[booking.status];
    if (!allowedNextStatuses || !allowedNextStatuses.includes(newStatus)) {
      return NextResponse.json({ error: `Invalid state transition from ${booking.status} to ${newStatus}` }, { status: 400 });
    }

    const updatedBooking = await prisma.transportBooking.update({
      where: { id },
      data: { status: newStatus, completedAt: newStatus === 'COMPLETED' ? new Date() : null }
    });

    // Trigger financial settlement on COMPLETED
    if (newStatus === 'COMPLETED') {
      const bookingInfo = await prisma.transportBooking.findUnique({ where: { id }, select: { groupTransactionId: true } });
      if (bookingInfo?.groupTransactionId) {
        await processGroupTransportSettlement(id);
      } else {
        await processTransportSettlement(id);
      }
    }

    // If COMPLETED, set vehicle back to AVAILABLE
    if (newStatus === 'COMPLETED' && booking.vehicleId) {
      await prisma.transportVehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'AVAILABLE' }
      });
    }

    await prisma.deliveryEvent.create({
      data: {
        bookingId: id,
        eventType: newStatus,
        notes: notes || `Status updated to ${newStatus}`,
        location: location || null
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_STATUS_CHANGED',
        actorType: 'TRANSPORT_PROVIDER',
        actorId: provider.id,
        entityType: 'TransportBooking',
        entityId: booking.id,
        before: { status: booking.status },
        after: { status: newStatus }
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
