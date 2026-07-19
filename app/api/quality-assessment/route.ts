import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';

// POST /api/quality-assessment — farmer submits quality info for a settled transaction
export async function POST(req: NextRequest) {
  const phone = getFarmerSession(req);
  if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { transactionId, moistureAnswer, grainColour, brokenGrain, foreignMatter, notes } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }

    const farmer = await prisma.farmer.findUnique({ where: { phone }, select: { id: true } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, farmerId: true, status: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    if (transaction.farmerId !== farmer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!['SETTLED', 'DELIVERED', 'CONFIRMED'].includes(transaction.status)) {
      return NextResponse.json(
        { error: 'Quality assessment is only available for CONFIRMED, DELIVERED or SETTLED transactions' },
        { status: 400 }
      );
    }

    const existing = await prisma.qualityAssessment.findUnique({ where: { transactionId } });
    if (existing) {
      return NextResponse.json(
        { error: 'Quality assessment already submitted for this transaction' },
        { status: 409 }
      );
    }

    const assessment = await prisma.qualityAssessment.create({
      data: {
        transactionId,
        moistureAnswer: moistureAnswer ?? null,
        grainColour:    grainColour    ?? null,
        brokenGrain:    brokenGrain    ?? null,
        foreignMatter:  foreignMatter  ?? null,
        notes:          notes          ?? null,
      },
    });

    console.log('[NOTIFICATIONS] Quality assessment created for transaction:', transactionId);
    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('[NOTIFICATIONS] POST quality-assessment error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/quality-assessment?transactionId=xxx — farmer reads their own assessment
export async function GET(req: NextRequest) {
  const phone = getFarmerSession(req);
  if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const transactionId    = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId query param is required' }, { status: 400 });
    }

    const farmer = await prisma.farmer.findUnique({ where: { phone }, select: { id: true } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { farmerId: true },
    });
    if (!transaction || transaction.farmerId !== farmer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const assessment = await prisma.qualityAssessment.findUnique({ where: { transactionId } });
    if (!assessment) {
      return NextResponse.json({ error: 'No assessment found' }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[NOTIFICATIONS] GET quality-assessment error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
