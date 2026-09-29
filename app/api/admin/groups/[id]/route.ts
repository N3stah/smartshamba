import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { sendNotification } from '@/lib/notifications';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const group = await prisma.farmerGroup.findUnique({
      where: { id },
      include: {
        county: true,
        ward: true,
        createdBy: { select: { id: true, name: true, phone: true } },
        members: {
          include: {
            farmer: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        transactions: {
          include: { buyer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('[ADMIN GROUPS] GET error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, village, countyId, wardId, active, verified, whatsappApproved } = body;

    const existing = await prisma.farmerGroup.findUnique({ 
      where: { id },
      include: { createdBy: { select: { phone: true } } }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const updated = await prisma.farmerGroup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(village !== undefined && { village }),
        ...(countyId !== undefined && { countyId }),
        ...(wardId !== undefined && { wardId }),
        ...(active !== undefined && { active }),
        ...(verified !== undefined && { verified }),
        ...(whatsappApproved !== undefined && { whatsappApproved }),
      },
    });

    // Send SMS if group was just verified
    if (verified === true && !existing.verified && existing.createdBy?.phone) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: existing.createdBy.phone,
        body: `SmartShamba: Your group "${existing.name}" has been approved! Farmers can now join via USSD.`
      }).catch(e => console.error('[ADMIN] Group approval SMS failed:', e));
    }

    // Send SMS if WhatsApp link was just approved
    if (whatsappApproved === true && !existing.whatsappApproved && existing.createdBy?.phone) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: existing.createdBy.phone,
        body: `SmartShamba: The WhatsApp link for group "${existing.name}" has been approved and is now visible to members.`
      }).catch(e => console.error('[ADMIN] WhatsApp approval SMS failed:', e));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ADMIN GROUPS] PATCH error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
