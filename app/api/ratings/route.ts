import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    const { transactionId, score } = await req.json();

    if (!transactionId || score == null) {
      return NextResponse.json(
        { error: 'transactionId and score are required' },
        { status: 400 }
      );
    }

    const scoreNum = Number(score);
    if (!Number.isInteger(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      return NextResponse.json(
        { error: 'score must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify this transaction belongs to the authenticated farmer
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { farmerId: true, buyerId: true, status: true },
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.farmerId !== farmer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (tx.status !== 'SETTLED') {
      return NextResponse.json(
        { error: 'Can only rate settled transactions' },
        { status: 400 }
      );
    }

    // Upsert: create or update the farmer's rating for this transaction
    const rating = await prisma.rating.upsert({
      where: {
        transactionId_raterType: {
          transactionId,
          raterType: 'FARMER',
        },
      },
      update: { score: scoreNum },
      create: {
        transactionId,
        farmerId: farmer.id,
        buyerId: tx.buyerId,
        raterType: 'FARMER',
        score: scoreNum,
      },
    });

    // Return the buyer's updated average score
    const buyerAgg = await prisma.rating.aggregate({
      where: { buyerId: tx.buyerId },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      rating,
      buyerAverage: buyerAgg._avg.score ?? null,
      buyerTotalRatings: buyerAgg._count.score,
    });
  } catch (error) {
    console.error('[RATINGS] Error:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}