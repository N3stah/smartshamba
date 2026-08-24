import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const offers = await prisma.negotiationOffer.findMany({
      where: { transactionId: id },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(offers);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { pricePerUnit, quantity, terms } = body;

    // Create the new offer
    const newOffer = await prisma.negotiationOffer.create({
      data: {
        transactionId: id,
        actor: session.role === 'farmer' ? 'SELLER' : 'BUYER', // Map role to actor
        pricePerUnit: parseFloat(pricePerUnit),
        quantity: parseInt(quantity),
        terms
      }
    });

    // Reject all previous pending offers automatically
    await prisma.negotiationOffer.updateMany({
      where: { 
        transactionId: id, 
        id: { not: newOffer.id },
        status: 'PENDING' 
      },
      data: { status: 'REJECTED' }
    });

    return NextResponse.json(newOffer, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
