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
    const { reason } = await req.json();
    
    if (!reason || reason.length < 10) {
      return NextResponse.json({ error: 'A valid reason (min 10 chars) is required for override' }, { status: 400 });
    }

    const booking = await prisma.transportBooking.update({
      where: { id },
      data: {
        isHalted: false,
        weatherOverride: true,
        haltReason: `Admin Override: ${reason}`,
        weatherAlertId: null
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_WEATHER_OVERRIDE',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'TransportBooking',
        entityId: booking.id,
        after: { reason }
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('[API] Weather override error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
