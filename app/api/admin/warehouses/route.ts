import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { group: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('[ADMIN WAREHOUSES] GET error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, location, houseNumber, size, groupId, whatsappLink } = body;

    if (!name || !groupId) {
      return NextResponse.json({ error: 'Warehouse name and Group are required' }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location: location || null,
        houseNumber: houseNumber || null,
        size: size || null,
        groupId,
        whatsappLink: whatsappLink || null,
        whatsappApproved: false, // Always starts unapproved
      },
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('[ADMIN WAREHOUSES] POST error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
