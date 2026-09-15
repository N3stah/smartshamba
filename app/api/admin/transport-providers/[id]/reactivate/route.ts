import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CTO]);
    if (authError) return authError;

    const staff = await getStaffSession(req);
    if (!staff || staff.id === 'legacy-admin') {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });
    }

    const { id } = await params;
    const provider = await prisma.transportProvider.update({
      where: { id },
      data: { active: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_PROVIDER_REACTIVATED',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'TransportProvider',
        entityId: provider.id
      }
    });

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('[API] Reactivate provider error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
