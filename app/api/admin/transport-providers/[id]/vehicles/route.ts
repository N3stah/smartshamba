import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
    const body = await req.json();

    const vehicle = await prisma.transportVehicle.create({
      data: {
        providerId: id,
        registrationNumber: body.registrationNumber,
        vehicleType: body.vehicleType,
        capacityBags: parseInt(body.capacityBags),
        status: 'AVAILABLE'
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_VEHICLE_CREATED',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'TransportVehicle',
        entityId: vehicle.id,
        after: { registration: vehicle.registrationNumber, providerId: id }
      }
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || ['Field'];
      return NextResponse.json({ error: `${target.join(', ')} already in use.` }, { status: 409 });
    }
    console.error('[API] Create vehicle error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
