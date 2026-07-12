import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';
import { DisputeStatus } from '@prisma/client';

const VALID_STATUSES: DisputeStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];

export async function GET(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req);
    if (auth) return auth;

    const url = new URL(req.url);
    const statusParam = url.searchParams.get('status');

    const statusFilter =
      statusParam && VALID_STATUSES.includes(statusParam as DisputeStatus)
        ? (statusParam as DisputeStatus)
        : undefined;

    const disputes = await prisma.dispute.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: {
        transaction: {
          select: { reference: true, quantityBags: true, totalValue: true },
        },
        farmer: { select: { name: true, phone: true } },
        buyer: { select: { name: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[DISPUTES] Admin fetched', disputes.length, 'disputes');
    return NextResponse.json(disputes);
  } catch (error) {
    console.error('[DISPUTES] Admin GET error', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}