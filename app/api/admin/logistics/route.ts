import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;

    const bookings = await (prisma as any).transportBooking.findMany({
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
