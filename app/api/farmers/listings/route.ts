import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    
    const { product, quantityBags, pricePerBag } = await req.json();
    if (!product || !quantityBags || !pricePerBag) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    
    const listing = await prisma.produceListing.create({
      data: { farmerId: farmer.id, product, quantityBags: parseInt(quantityBags), pricePerBag: parseFloat(pricePerBag) }
    });
    
    return NextResponse.json({ success: true, listing });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
