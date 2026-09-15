import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession, getFarmerSession, getBuyerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

// GET - Provider fetches available requests (Phase D)
export async function GET(req: NextRequest) {
  try {
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    if (provider.verificationStatus !== 'VERIFIED' || !provider.active) {
      return NextResponse.json({ error: 'Provider not eligible for new jobs' }, { status: 403 });
    }

    const requests = await prisma.transportRequest.findMany({
      where: { status: 'REQUESTED' },
      include: {
        transaction: { include: { farmer: true, buyer: true } },
        groupTransaction: { include: { group: true, buyer: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[API] Transport requests error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Farmer/Buyer creates a new transport request (Phase E)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, pickupLocation, dropoffLocation, requestedPickupAt } = body;

    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);

    let requestedById = '';
    let requestedByType: 'FARMER' | 'BUYER';

    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      if (!farmer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      requestedById = farmer.id;
      requestedByType = 'FARMER';
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      if (!buyer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      requestedById = buyer.id;
      requestedByType = 'BUYER';
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // Server-side Ownership Check
    if (requestedByType === 'FARMER' && transaction.farmerId !== requestedById) {
      return NextResponse.json({ error: 'Forbidden: You do not own this transaction' }, { status: 403 });
    }
    if (requestedByType === 'BUYER' && transaction.buyerId !== requestedById) {
      return NextResponse.json({ error: 'Forbidden: You do not own this transaction' }, { status: 403 });
    }

    // Server-side Eligibility Check
    if (!['CONFIRMED', 'DELIVERY_SCHEDULED'].includes(transaction.status)) {
      return NextResponse.json({ error: 'Transaction not eligible for transport' }, { status: 400 });
    }

    // Duplicate Prevention
    const existingRequest = await prisma.transportRequest.findUnique({ where: { transactionId } });
    if (existingRequest && existingRequest.status !== 'CANCELLED' && existingRequest.status !== 'DECLINED') {
      return NextResponse.json({ error: 'Transport already requested for this transaction' }, { status: 409 });
    }
    
    const existingBooking = await prisma.transportBooking.findUnique({ where: { transactionId } });
    if (existingBooking && existingBooking.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Transport already booked for this transaction' }, { status: 409 });
    }

    // Group Transport Logic
    let groupTransactionId = body.groupTransactionId;
    let groupMembers: { farmerId: string; bagsPledged: number }[] = [];
    let totalBags = transaction.quantityBags;

    if (groupTransactionId) {
      const groupTx = await prisma.groupTransaction.findUnique({
        where: { id: groupTransactionId },
        include: { group: { include: { members: true } } }
      });
      if (!groupTx) return NextResponse.json({ error: 'Group transaction not found' }, { status: 404 });

      // Verify requester is part of the group
      const isMember = groupTx.group.members.some(m => m.farmerId === requestedById);
      if (!isMember) return NextResponse.json({ error: 'Not authorized to request transport for this group' }, { status: 403 });

      groupMembers = groupTx.group.members.filter(m => m.bagsPledged > 0);
      totalBags = groupMembers.reduce((sum, m) => sum + m.bagsPledged, 0);
    }

    const request = await prisma.transportRequest.create({
      data: {
        transactionId: groupTransactionId ? null : transactionId,
        groupTransactionId,
        requestedById,
        requestedByType,
        pickupLocation,
        dropoffLocation,
        quantityBags: totalBags,
        requestedPickupAt: requestedPickupAt ? new Date(requestedPickupAt) : null,
        status: 'REQUESTED'
      }
    });



    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_REQUEST_CREATED',
        actorType: requestedByType,
        actorId: requestedById,
        entityType: 'TransportRequest',
        entityId: request.id,
        after: { transactionId, status: 'REQUESTED' }
      }
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('[API] Create transport request error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
