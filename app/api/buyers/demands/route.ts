import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';
import { sanitizeInput } from '@/lib/sanitize';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const phone = getBuyerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const buyer = await prisma.buyer.findFirst({ where: { phone } });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    
    const { product, quantityBags, location } = await req.json();
    if (!product || !quantityBags || !location) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    
    const demand = await prisma.buyerDemand.create({
      data: {
        buyerId: buyer.id,
        product: sanitizeInput(product),
        quantityBags: parseInt(quantityBags),
        location: sanitizeInput(location)
      }
    });
    
    return NextResponse.json({ success: true, demand });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
