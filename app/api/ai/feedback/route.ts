// @ts-nocheck
// TODO: V2 - Re-enable type checking after this module schema is built
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { messageId, feedback } = await req.json();
    if (!messageId || !['POSITIVE', 'NEGATIVE'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    // Basic auth check
    if (!getFarmerSession(req) && !getBuyerSession(req) && requireAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { feedback }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] AI Feedback error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
