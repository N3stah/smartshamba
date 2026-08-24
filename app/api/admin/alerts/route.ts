// @ts-nocheck
// TODO: V2 - Re-enable type checking after this module schema is built
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    // Fetch recent severe weather alerts to display in the Executive Dashboard
    const dbAlerts = await (prisma as any).weatherAlert.findMany({
      where: { severity: { in: ['warning', 'extreme'] } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const alerts = dbAlerts.map(a => ({
      level: a.severity === 'extreme' ? 'HIGH' : 'MEDIUM',
      title: `${a.county} Weather Alert`,
      message: a.message
    }));

    return NextResponse.json(alerts);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
