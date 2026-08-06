import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBuyerSession } from '@/lib/auth';
import { convertToCSV, formatLedgerForCSV } from '@/lib/csvExport';

export async function GET(req: NextRequest) {
  try {
    const phone = getBuyerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({ where: { phone } });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const entries = await prisma.ledgerEntry.findMany({
      where: { userId: buyer.id, userType: 'BUYER' },
      orderBy: { createdAt: 'desc' }
    });

    const csv = convertToCSV(formatLedgerForCSV(entries));
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="smartshamba_procurement_statement.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
