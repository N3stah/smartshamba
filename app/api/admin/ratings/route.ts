import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { transactionId, reason, description } = await req.json();
    if (!transactionId || !reason) {
      console.error('[DISPUTES] Missing transactionId or reason');
      return NextResponse.json({ error: 'transactionId and reason are required' }, { status: 400 });
    }

    const allowedReasons = [
      'QUANTITY_MISMATCH',
      'QUALITY_REJECTED',
      'PAYMENT_DELAY',
      'BUYER_UNRESPONSIVE',
      'PRICE_CHANGED',
      'OTHER',
    ] as const;
    if (!allowedReasons.includes(reason)) {
      console.error('[DISPUTES] Invalid reason', reason);
      return NextResponse.json({ error: 'Invalid dispute reason' }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: { status: true, id: true, farmerId: true, buyerId: true },
     });
    if (!tx) {
      console.error('[DISPUTES] Transaction not found', transactionId);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const farmer = await prisma.farmer.findUnique({ where: { phone }, select: { id: true } });
    if (!farmer || tx.farmerId !== farmer.id) {
      console.error('[DISPUTES] Transaction does not belong to farmer', transactionId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SETTLED', 'DELIVERED'].includes(tx.status)) {
      console.error('[DISPUTES] Invalid transaction status for dispute', tx.status);
      return NextResponse.json({ error: 'Only settled or delivered transactions can be disputed' }, { status: 400 });
    }

    const existing = await prisma.dispute.findUnique({
      where: { transactionId },
    });
    if (existing) {
      console.error('[DISPUTES] Dispute already exists for transaction', transactionId);
      return NextResponse.json({ error: 'Dispute already exists for this transaction' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.dispute.create({
        data: {
          transactionId,
          farmerId: farmer.id,
          buyerId: tx.buyerId,
          reason,
          description,
        },
      }),
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'DISPUTED' },
      }),
    ]);

    console.log('[DISPUTES] Created dispute for transaction', transactionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DISPUTES] Unexpected error', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone }, select: { id: true } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const disputes = await prisma.dispute.findMany({
      where: { farmerId: farmer.id },
      include: {
        transaction: {
          select: { reference: true, quantityBags: true, totalValue: true },
        },
        buyer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[DISPUTES] Fetched', disputes.length, 'disputes for farmer', farmer.id);
    return NextResponse.json(disputes);
  } catch (error) {
    console.error('[DISPUTES] GET error', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}