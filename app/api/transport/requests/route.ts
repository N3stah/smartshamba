import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    // Eligibility: Provider must be VERIFIED and ACTIVE
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
