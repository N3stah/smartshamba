import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { convertToCSV, formatLedgerForCSV } from '@/lib/csvExport';

export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId: farmer.id },
      orderBy: { createdAt: 'desc' }
    });

    const csv = convertToCSV(formatLedgerForCSV(entries));
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="smartshamba_wallet_statement.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
