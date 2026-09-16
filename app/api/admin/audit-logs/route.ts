import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { getAuditLogs } from '@/lib/auditLog';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType') ?? undefined;
    const action = searchParams.get('action') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const result = await getAuditLogs({
      entityType,
      action,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ADMIN] Error fetching audit logs:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
