import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // const authError = requireAdminAuth(req);
 // if (authError) return authError;

  try {
    const buyers = await prisma.buyer.findMany({
      orderBy: { 
        name: 'asc' 
      },
    });
    return NextResponse.json(buyers);
  } catch (error) {
    console.error('[ADMIN] Get buyers error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  //const authError = requireAdminAuth(req);
 // if (authError) return authError;

  try {
    const body = await req.json();
    const { name, location, pricePerBag, capacityBags } = body;

    if (!name || !location || !pricePerBag || !capacityBags) {
      return NextResponse.json(
        { error: 'name, location, pricePerBag, and capacityBags are required' },
        { status: 400 }
      );
    }

    if (typeof pricePerBag !== 'number' || pricePerBag <= 0) {
      return NextResponse.json({ error: 'pricePerBag must be a positive number' }, { status: 400 });
    }

    if (typeof capacityBags !== 'number' || capacityBags <= 0 || !Number.isInteger(capacityBags)) {
      return NextResponse.json({ error: 'capacityBags must be a positive integer' }, { status: 400 });
    }

    const existing = await prisma.buyer.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({ error: `Buyer "${name}" already exists` }, { status: 409 });
    }

    const buyer = await prisma.buyer.create({
      data: { name, location, pricePerBag, capacityBags, verified: true, active: true },
    });

    console.log(`[ADMIN] Created buyer: ${buyer.name}`);
    return NextResponse.json(buyer, { status: 201 });
  } catch (error) {
    console.error('[ADMIN] Create buyer error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
