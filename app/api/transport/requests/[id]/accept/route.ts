import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import { updateContractTerms } from '@/lib/contracts/contract-service';
import { calculateDistance, estimateCost } from '@/lib/transport/transport-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params;
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    if (provider.verificationStatus !== 'VERIFIED' || !provider.active) {
      return NextResponse.json({ error: 'Provider not eligible' }, { status: 403 });
    }

    const body = await req.json();
    const { vehicleId } = body;
    if (!vehicleId) return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });

    // Server-side vehicle ownership and operational check
    const vehicle = await prisma.transportVehicle.findFirst({
      where: { id: vehicleId, providerId: provider.id, isActive: true, status: 'AVAILABLE' }
    });
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not available or not owned' }, { status: 404 });

    // Concurrency-Safe Atomic Claim
    // Only claims the request if it is still REQUESTED
    const claimedRequest = await prisma.transportRequest.updateMany({
      where: { id: requestId, status: 'REQUESTED' },
      data: { status: 'MATCHED', providerId: provider.id }
    });

    if (claimedRequest.count === 0) {
      return NextResponse.json({ error: 'Request is no longer available' }, { status: 409 });
    }

    // Fetch the claimed request to build the booking
    const request = await prisma.transportRequest.findUnique({
      where: { id: requestId },
      include: { transaction: true, groupTransaction: true }
    });

    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    // Calculate distance and cost
    const distance = calculateDistance(request.pickupLocation, request.dropoffLocation);
    const cost = estimateCost(distance, request.quantityBags, provider.ratePerKm ?? 0);

    // Determine farmerId
    let farmerId = '';
    if (request.transaction) {
      farmerId = request.transaction.farmerId;
    } else if (request.groupTransaction) {
      // Derive farmerId from group creator for now if group transaction
      const group = await prisma.farmerGroup.findUnique({ where: { id: request.groupTransaction.groupId } });
      farmerId = group?.createdById || '';
    }

    if (!farmerId) {
      // Fallback if we can't find farmer
      await prisma.transportRequest.update({ where: { id: requestId }, data: { status: 'REQUESTED', providerId: null } });
      return NextResponse.json({ error: 'Could not determine farmer for booking' }, { status: 400 });
    }

    // Create TransportBooking
    const booking = await prisma.transportBooking.create({
      data: {
        requestId: request.id,
        transactionId: request.transactionId,
        groupTransactionId: request.groupTransactionId,
        providerId: provider.id,
        vehicleId: vehicle.id,
        farmerId: farmerId,
        pickupLocation: request.pickupLocation,
        dropoffLocation: request.dropoffLocation,
        distanceKm: distance,
        cost: cost,
        bookedById: provider.id,
        bookedByType: 'FARMER', // Placeholder, needs schema update to allow TRANSPORT if required, but V1 uses FARMER/BUYER
        status: 'ACCEPTED'
      }
    });

    // Update Request to ACCEPTED
    await prisma.transportRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });

    // Update Vehicle status to IN_SERVICE
    await prisma.transportVehicle.update({
      where: { id: vehicle.id },
      data: { status: 'IN_SERVICE' }
    });

    // Create DeliveryEvent
    await prisma.deliveryEvent.create({
      data: {
        bookingId: booking.id,
        eventType: 'ACCEPTED',
        notes: `Booking accepted by ${provider.name}`
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_REQUEST_ACCEPTED',
        actorType: 'TRANSPORT_PROVIDER',
        actorId: provider.id,
        entityType: 'TransportBooking',
        entityId: booking.id,
        after: { requestId: request.id, vehicleId: vehicle.id, status: 'ACCEPTED' }
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('[API] Accept request error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
