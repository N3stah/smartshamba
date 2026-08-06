import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    const isAdmin = !requireAdminAuth(req);

    let suggestions: string[] = [];

    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({
        where: { phone: farmerPhone },
        include: { ProduceListing: { where: { status: 'ACTIVE' }, take: 1 }, transactions: { where: { status: 'PENDING' }, take: 1 } }
      });
      if (farmer) {
        if (farmer.ProduceListing.length === 0) suggestions.push('How do I create a produce listing?');
        if (farmer.transactions.length > 0) suggestions.push('Check my pending payments');
        suggestions.push('Analyze maize market', 'Explain group selling');
      }
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({
        where: { phone: buyerPhone },
        include: { BuyerDemand: { where: { status: 'ACTIVE' }, take: 1 }, transactions: { where: { status: 'PENDING' }, take: 1 } }
      });
      if (buyer) {
        if (buyer.BuyerDemand.length === 0) suggestions.push('How do I post a buyer demand?');
        if (buyer.transactions.length > 0) suggestions.push('Track my deliveries');
        suggestions.push('Find 500 bags of maize', 'Analyze procurement');
      }
    } else if (isAdmin) {
      suggestions = ['Platform statistics', 'Check open disputes', 'Market overview'];
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
