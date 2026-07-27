import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { convertToCSV, formatTransactionsForCSV } from '@/lib/csvExport';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const transactions = await prisma.transaction.findMany({
      include: { farmer: true, buyer: true },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to prevent memory issues
    });

    const csv = convertToCSV(formatTransactionsForCSV(transactions));
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="smartshamba_transactions.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
