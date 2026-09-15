import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params;
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    // If the provider had previously matched it, unmatch it. Otherwise just ignore.
    await prisma.transportRequest.updateMany({
      where: { id: requestId, status: 'MATCHED', providerId: provider.id },
      data: { status: 'REQUESTED', providerId: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Decline request error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
