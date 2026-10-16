import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTransportAuth, getTransportSession } from '@/lib/auth';
import { captureEvidence } from '@/lib/deal-assurance/service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireTransportAuth(req);
  if (authError) return authError;

  try {
    const phone = getTransportSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // In a real app, you'd fetch the providerId from the session/phone
    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const body = await req.json();
    const { photoRef, weightKg, moistureLevel, qualityNote } = body;

    const result = await captureEvidence({
      bookingId: id,
      photoRef,
      weightKg,
      moistureLevel,
      qualityNote,
    }, provider.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Evidence captured successfully.' });

  } catch (error) {
    console.error('[EVIDENCE API] Error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
