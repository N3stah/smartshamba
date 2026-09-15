import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CTO]);
    if (authError) return authError;

    const staff = await getStaffSession(req);
    if (!staff || staff.id === 'legacy-admin') {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    
    // Fetch BEFORE state
    const existingProvider = await prisma.transportProvider.findUnique({ where: { id } });
    if (!existingProvider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const updateData: any = {};
    let identityChanged = false;
    
    if (body.name && body.name !== existingProvider.name) { updateData.name = body.name; identityChanged = true; }
    if (body.phone && body.phone !== existingProvider.phone) { updateData.phone = body.phone; identityChanged = true; }
    if (body.email !== undefined && body.email !== existingProvider.email) { updateData.email = body.email || null; identityChanged = true; }
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson || null;
    if (body.baseLocation !== undefined) updateData.baseLocation = body.baseLocation || null;
    if (body.ratePerKm !== undefined) updateData.ratePerKm = body.ratePerKm ? parseFloat(body.ratePerKm) : null;

    // If identity fields changed, revert to UNDER_REVIEW for re-verification
    if (identityChanged && existingProvider.verificationStatus === 'VERIFIED') {
      updateData.verificationStatus = 'UNDER_REVIEW';
      updateData.verifiedAt = null;
      updateData.verifiedBy = null;
    }

    const provider = await prisma.transportProvider.update({
      where: { id },
      data: updateData
    });

    // Audit Log (Before & After)
    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_PROVIDER_UPDATED',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'TransportProvider',
        entityId: provider.id,
        before: { name: existingProvider.name, phone: existingProvider.phone, email: existingProvider.email, ratePerKm: existingProvider.ratePerKm, verificationStatus: existingProvider.verificationStatus },
        after: updateData
      }
    });

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || ['Field'];
      return NextResponse.json({ error: `${target.join(', ')} already in use.` }, { status: 409 });
    }
    console.error('[API] Update transport provider error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
