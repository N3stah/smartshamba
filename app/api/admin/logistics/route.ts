import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const bookings = await prisma.transportBooking.findMany({
      include: {
        provider: true,
        transaction: { include: { farmer: true, buyer: true } },
        groupTransaction: { include: { group: true, buyer: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('[API] Admin logistics error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
