import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getFarmerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications/history — farmer views their notification history
export async function GET(req: NextRequest) {
  const phone = getFarmerSession(req);
  if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

    const notifications = await prisma.notification.findMany({
      where: { farmerId: farmer.id },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        type: true,
        body: true,
        status: true,
        retries: true,
        sentAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[NOTIFICATIONS] GET history error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}