import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationStatus, NotificationType } from '@/lib/notifications/types';

// GET /api/admin/notifications — paginated notification log with stats
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as NotificationStatus | null;
    const type   = searchParams.get('type')   as NotificationType   | null;
    const take   = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const where = {
      ...(status ? { status } : {}),
      ...(type   ? { type }   : {}),
    };

    const [notifications, stats] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          farmer: { select: { name: true, phone: true } },
        },
      }),
      prisma.notification.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const statMap = Object.fromEntries(
      stats.map((s) => [s.status, s._count.id])
    );

    console.log('[NOTIFICATIONS] Admin fetched', notifications.length, 'notifications');
    return NextResponse.json({
      notifications,
      stats: {
        sent:     statMap['SENT']     ?? 0,
        failed:   statMap['FAILED']   ?? 0,
        pending:  statMap['PENDING']  ?? 0,
        retrying: statMap['RETRYING'] ?? 0,
        total:    notifications.length,
      },
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Admin GET error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}