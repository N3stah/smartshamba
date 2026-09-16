import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;

    // Fetch raw transaction data for export
    const transactions = await prisma.transaction.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' },
      include: { farmer: { select: { name: true, village: true } }, buyer: { select: { name: true, location: true } } }
    });

    // Format for CSV/JSON export
    const data = transactions.map(tx => ({
      TxID: tx.id,
      Ref: tx.reference,
      Status: tx.status,
      Bags: tx.quantityBags,
      PricePerBag: tx.pricePerBag,
      TotalValue: tx.totalValue,
      MpesaRef: tx.mpesaRef || 'N/A',
      Farmer: tx.farmer.name || 'Unknown',
      FarmerLocation: tx.farmer.village || 'Unknown',
      Buyer: tx.buyer.name,
      BuyerLocation: tx.buyer.location,
      Date: new Date(tx.createdAt).toISOString()
    }));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
