import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(req);
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

    console.log('[ADMIN GROUPS] GET group:', id);
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
  const auth = requireAdminAuth(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, village, countyId, wardId, active } = body;

    const existing = await prisma.farmerGroup.findUnique({ where: { id } });
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
      },
    });

    console.log('[ADMIN GROUPS] Updated group:', id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ADMIN GROUPS] PATCH error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
