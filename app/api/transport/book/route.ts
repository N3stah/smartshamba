import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession } from '@/lib/auth';
import { calculateDistance, estimateCost } from '@/lib/transport/transport-service';
import { postLedgerEntry } from '@/lib/finance/ledger-service';
import { updateContractTerms } from '@/lib/contracts/contract-service';
import * as Sentry from '@sentry/nextjs';

// POST - Book transport for a transaction
export async function POST(req: NextRequest) {
  try {
    const { transactionId, providerId } = await req.json();
    if (!transactionId || !providerId) {
      return NextResponse.json({ error: 'Missing transactionId or providerId' }, { status: 400 });
    }

    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);

    if (!farmerPhone && !buyerPhone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { 
        farmer: { include: { county: true } }, 
        buyer: { include: { county: true } } 
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if transport is already booked
    const existingBooking = await prisma.transportBooking.findUnique({
      where: { transactionId }
    });
    if (existingBooking) {
      return NextResponse.json({ error: 'Transport already booked for this transaction' }, { status: 400 });
    }

    const provider = await prisma.transportProvider.findUnique({
      where: { id: providerId }
    });
    if (!provider || !provider.active) {
      return NextResponse.json({ error: 'Provider not available' }, { status: 400 });
    }

    // Calculate distance and cost
    const farmerCounty = transaction.farmer.county?.name || 'Nairobi';
    const buyerCounty = transaction.buyer.county?.name || 'Nairobi';
    const distance = calculateDistance(farmerCounty, buyerCounty);
    const cost = estimateCost(distance, transaction.quantityBags, provider.ratePerKm ?? 0);

    // Determine who is booking
    let bookedById = '';
    let bookedByType: 'FARMER' | 'BUYER' = 'FARMER';
    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      bookedById = farmer?.id || '';
      bookedByType = 'FARMER';
    } else {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      bookedById = buyer?.id || '';
      bookedByType = 'BUYER';
    }

    const booking = await prisma.transportBooking.create({
      data: {
        transactionId,
        providerId,
        farmerId: transaction.farmerId,
        cost,
        distanceKm: distance,
        pickupLocation: `${farmerCounty} County`,
        dropoffLocation: `${buyerCounty} County`,
        bookedById,
        bookedByType,
        status: 'PENDING'
      }
    });

    // V2.0 Stage 5: Record Double-Entry for Transport Payment
    await postLedgerEntry({
      walletId: bookedById,
      transactionId: transaction.id,
      type: 'DEBIT',
      amount: cost,
      description: `Transport cost for Booking ${booking.id.substring(0, 8)}`,
      reference: `TRNSPT-${booking.id.substring(0, 8)}`
    });
    await postLedgerEntry({
      walletId: provider.id,
      transactionId: transaction.id,
      type: 'CREDIT',
      amount: cost,
      description: `Transport earnings for Booking ${booking.id.substring(0, 8)}`,
      reference: `TRNSPT-${booking.id.substring(0, 8)}`
    });

    // DCMS Integration: Update Contract Transport Terms
    await updateContractTerms(transaction.id, { transportTerms: `${bookedByType}_PAYS` });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('[API] Transport booking error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
