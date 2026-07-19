import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import { harvestAdvisoryTemplate } from '@/lib/notifications/templates';

// Vercel Cron: runs daily at 07:00 EAT (04:00 UTC)
// Add to vercel.json crons: { "path": "/api/cron/advisories", "schedule": "0 4 * * *" }

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    secret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Fetch all active advisories currently in their active date window
    const advisories = await prisma.advisory.findMany({
      where: {
        active:    true,
        startDate: { lte: now },
        endDate:   { gte: now },
      },
      include: { county: { select: { id: true, name: true } } },
    });

    if (advisories.length === 0) {
      console.log('[NOTIFICATIONS] Advisory cron: no active advisories today');
      return NextResponse.json({ skipped: true, reason: 'No active advisories' });
    }

    let totalSent   = 0;
    let totalFailed = 0;

    for (const advisory of advisories) {
      // County-specific advisory → only farmers in that county
      // National advisory (countyId null) → all farmers
      const farmers = await prisma.farmer.findMany({
        where: advisory.countyId
          ? { countyId: advisory.countyId }
          : {},
        select: { id: true, phone: true },
      });

      const body = harvestAdvisoryTemplate({
        title:   advisory.title,
        message: advisory.message,
      });

      console.log(
        '[NOTIFICATIONS] Sending advisory:', advisory.title,
        'to', farmers.length, 'farmers',
        advisory.county ? `in ${advisory.county.name}` : '(national)'
      );

      for (const farmer of farmers) {
        const result = await sendNotification({
          type:           'HARVEST_ADVISORY',
          recipientPhone: farmer.phone,
          body,
          farmerId:       farmer.id,
        });
        if (result.success) totalSent++; else totalFailed++;
      }
    }

    console.log('[NOTIFICATIONS] Advisory cron done. Sent:', totalSent, 'Failed:', totalFailed);
    return NextResponse.json({
      success:         true,
      advisoriesRun:   advisories.length,
      totalSent,
      totalFailed,
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Advisory cron error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}