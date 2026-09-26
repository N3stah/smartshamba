import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { assignSmartShambaId } from '@/lib/smartshamba-id';
import { sendNotification } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const buyers = await prisma.buyer.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(buyers);
  } catch (error) {
    console.error('[ADMIN] Get buyers error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, location, pricePerBag, capacityBags, phone, countyId } = body;

    if (!name || !location || !pricePerBag || !capacityBags || !countyId) {
      return NextResponse.json(
        { error: 'name, location, pricePerBag, capacityBags, and countyId are required' },
        { status: 400 }
      );
    }

    const county = await prisma.county.findUnique({ where: { id: countyId } });
    if (!county) {
      return NextResponse.json({ error: 'Invalid countyId' }, { status: 400 });
    }

    const existing = await prisma.buyer.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({ error: `Buyer "${name}" already exists` }, { status: 409 });
    }

    const { buyer, smartshambaId } = await prisma.$transaction(async (tx) => {
      const buyer = await tx.buyer.create({
        data: { name, location, pricePerBag, capacityBags, phone, countyId, verified: true, active: true },
      });
      const sid = await assignSmartShambaId('BUYER', buyer.id, county.code, tx);
      return { buyer, smartshambaId: sid };
    });

    if (buyer.phone) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: buyer.phone,
        body: `SmartShamba: Registration successful. Your ID is ${smartshambaId}.`
      }).catch(e => console.error('[ADMIN] Buyer SMS failed:', e));
    }

    console.log(`[ADMIN] Created buyer: ${buyer.name} with ID: ${smartshambaId}`);
    return NextResponse.json({ ...buyer, smartshambaId }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN] Create buyer error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
