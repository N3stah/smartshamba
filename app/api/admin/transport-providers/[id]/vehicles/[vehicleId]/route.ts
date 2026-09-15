import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; vehicleId: string }> }) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CTO]);
    if (authError) return authError;

    const staff = await getStaffSession(req);
    if (!staff || staff.id === 'legacy-admin') {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });
    }

    const { id, vehicleId } = await params;
    const body = await req.json();

    // Fetch BEFORE state and verify ownership
    const existingVehicle = await prisma.transportVehicle.findFirst({
      where: { id: vehicleId, providerId: id }
    });

    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found or does not belong to this provider' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.registrationNumber) updateData.registrationNumber = body.registrationNumber;
    if (body.vehicleType) updateData.vehicleType = body.vehicleType;
    if (body.capacityBags) updateData.capacityBags = parseInt(body.capacityBags);
    if (body.status) updateData.status = body.status; // AVAILABLE, MAINTENANCE, etc.
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const vehicle = await prisma.transportVehicle.update({
      where: { id: vehicleId },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_VEHICLE_UPDATED',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'TransportVehicle',
        entityId: vehicle.id,
        before: { registration: existingVehicle.registrationNumber, status: existingVehicle.status, isActive: existingVehicle.isActive },
        after: updateData
      }
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || ['Field'];
      return NextResponse.json({ error: `${target.join(', ')} already in use.` }, { status: 409 });
    }
    console.error('[API] Update vehicle error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
