import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';


export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CTO, StaffRole.CFO, StaffRole.PM, StaffRole.CEO]);
    if (authError) return authError;

    const providers = await prisma.transportProvider.findMany({
      include: { vehicles: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ providers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CTO]);
    if (authError) return authError;

    const staff = await getStaffSession(req);
    if (!staff || staff.id === 'legacy-admin') {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });
    }

    const body = await req.json();
    
    // Generate a secure temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2);
    const hash = await bcrypt.hash(tempPassword, 10);

    const provider = await prisma.transportProvider.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        contactPerson: body.contactPerson || null,
        nationalId: body.nationalId || null,
        baseLocation: body.baseLocation || null,
        countyId: body.countyId || null,
        ratePerKm: body.ratePerKm ? parseFloat(body.ratePerKm) : null,
        passwordHash: hash,
        verificationStatus: 'PENDING' // Default status
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'TRANSPORT_PROVIDER_CREATED',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'TransportProvider',
        entityId: provider.id,
        after: { name: provider.name, phone: provider.phone }
      }
    });

    // Return the temporary password ONLY on creation so CTO can give it to the provider securely
    return NextResponse.json({ success: true, provider, temporaryPassword: tempPassword });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || ['Field'];
      return NextResponse.json({ error: `${target.join(', ')} already in use.` }, { status: 409 });
    }
    console.error('[API] Create transport provider error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
