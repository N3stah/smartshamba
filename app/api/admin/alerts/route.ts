import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    // Fetch recent severe weather alerts to display in the Executive Dashboard
    const dbAlerts = await prisma.weatherAlert.findMany({
      where: { severity: { in: ['WARNING', 'CRITICAL'] } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const alerts = dbAlerts.map(a => ({
      level: a.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
      title: `${a.county} Weather Alert`,
      message: a.message
    }));

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('[API] Admin alerts error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
