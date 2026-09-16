import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { messageId, feedback } = await req.json();
    if (!messageId || !['POSITIVE', 'NEGATIVE'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    // Basic auth check
    if (!getFarmerSession(req) && !getBuyerSession(req) && await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { feedback } as any
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] AI Feedback error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
