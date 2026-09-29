import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import { sendNotification } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { group: { select: { name: true, createdBy: { select: { phone: true } } } } },
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

// New PATCH route for approving WhatsApp link
export async function PATCH(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, whatsappApproved } = body;

    if (!id || whatsappApproved === undefined) {
      return NextResponse.json({ error: 'Warehouse ID and whatsappApproved status are required' }, { status: 400 });
    }

    const existing = await prisma.warehouse.findUnique({
      where: { id },
      include: { group: { select: { name: true, createdBy: { select: { phone: true } } } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    const updated = await prisma.warehouse.update({
      where: { id },
      data: { whatsappApproved },
    });

    // Send SMS if WhatsApp link was just approved
    if (whatsappApproved === true && !existing.whatsappApproved && existing.group?.createdBy?.phone) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: existing.group.createdBy.phone,
        body: `SmartShamba: The WhatsApp link for warehouse "${existing.name}" has been approved.`
      }).catch(e => console.error('[ADMIN] Warehouse WhatsApp approval SMS failed:', e));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ADMIN WAREHOUSES] PATCH error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
