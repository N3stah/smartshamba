import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

const MAX_BAGS = 10000;

function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SS-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status   = searchParams.get('status');
    const farmerId = searchParams.get('farmerId');
    const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(status   ? { status: status as 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'SETTLED' | 'DISPUTED' } : {}),
        ...(farmerId ? { farmerId } : {}),
      },
      include: { farmer: true, buyer: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { farmerId, buyerId, quantityBags } = body;

    if (!farmerId || !buyerId || quantityBags === undefined) {
      return NextResponse.json(
        { error: 'farmerId, buyerId, and quantityBags are required' },
        { status: 400 }
      );
    }

    if (typeof farmerId !== 'string' || farmerId.trim() === '') {
      return NextResponse.json(
        { error: 'farmerId must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof buyerId !== 'string' || buyerId.trim() === '') {
      return NextResponse.json(
        { error: 'buyerId must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof quantityBags !== 'number' || !Number.isInteger(quantityBags) || quantityBags <= 0) {
      return NextResponse.json(
        { error: 'quantityBags must be a positive integer' },
        { status: 400 }
      );
    }

    if (quantityBags > MAX_BAGS) {
      return NextResponse.json(
        { error: `quantityBags cannot exceed ${MAX_BAGS} bags per transaction` },
        { status: 400 }
      );
    }

    const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    if (!buyer.active) {
      return NextResponse.json(
        { error: 'Buyer is not currently active' },
        { status: 400 }
      );
    }

    if (quantityBags > buyer.capacityBags) {
      return NextResponse.json(
        { error: `Buyer capacity is ${buyer.capacityBags} bags. Requested: ${quantityBags}` },
        { status: 400 }
      );
    }

    const pricePerBag = buyer.pricePerBag;
    const totalValue  = pricePerBag * quantityBags;
    const reference   = generateReference();

    const transaction = await prisma.transaction.create({
      data: {
        reference,
        farmerId,
        buyerId,
        quantityBags,
        pricePerBag,
        totalValue,
        status: 'PENDING',
      },
      include: { farmer: true, buyer: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
