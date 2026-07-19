import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getFarmerSession } from '@/lib/auth';
import { getPreferences, upsertPreferences } from '@/lib/notifications/preferences';

// GET /api/notifications/preferences — farmer reads their own preferences
export async function GET(req: NextRequest) {
  const phone = getFarmerSession(req);
  if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { prisma } = await import('@/lib/prisma');
    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const prefs = await getPreferences(farmer.id);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error('[NOTIFICATIONS] GET preferences error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/preferences — farmer updates preferences
export async function PUT(req: NextRequest) {
  const phone = getFarmerSession(req);
  if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { prisma } = await import('@/lib/prisma');
    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const body = await req.json();

    // Only accept known boolean fields — ignore anything else
    const ALLOWED = [
      'transactionSms',
      'weeklyMarketReport',
      'harvestTips',
      'qualityAlerts',
      'disputeUpdates',
    ] as const;

    const updates: Record<string, boolean> = {};
    for (const key of ALLOWED) {
      if (key in body && typeof body[key] === 'boolean') {
        updates[key] = body[key] as boolean;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid preference fields provided' }, { status: 400 });
    }

    const prefs = await upsertPreferences(farmer.id, updates);
    console.log('[NOTIFICATIONS] Preferences updated for farmer:', farmer.id);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error('[NOTIFICATIONS] PUT preferences error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}