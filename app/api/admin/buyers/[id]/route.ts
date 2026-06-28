import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { requireAdminAuth } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
 // const authError = requireAdminAuth(req);
  //if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, location, pricePerBag, capacityBags } = body;

    if (!name || !location || !pricePerBag || !capacityBags) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (typeof pricePerBag !== 'number' || pricePerBag <= 0) {
      return NextResponse.json({ error: 'pricePerBag must be a positive number' }, { status: 400 });
    }

    if (typeof capacityBags !== 'number' || capacityBags <= 0 || !Number.isInteger(capacityBags)) {
      return NextResponse.json({ error: 'capacityBags must be a positive integer' }, { status: 400 });
    }

    const buyer = await prisma.buyer.findUnique({ where: { id } });
    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    const updated = await prisma.buyer.update({
      where: { id },
      data: { name, location, pricePerBag, capacityBags },
    });

    console.log(`[ADMIN] Updated buyer: ${updated.name}`);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ADMIN] Update buyer error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // const authError = requireAdminAuth(req);
  // if (authError) return authError;

  try {
    const { id } = await params;

    const buyer = await prisma.buyer.findUnique({ where: { id } });
    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    const updated = await prisma.buyer.update({
      where: { id },
      data: { active: !buyer.active },
    });

    console.log(`[ADMIN] Toggled buyer ${updated.name} → ${updated.active ? 'active' : 'inactive'}`);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ADMIN] Toggle buyer error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
