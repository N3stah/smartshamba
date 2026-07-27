import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { convertToCSV, formatFarmersForCSV } from '@/lib/csvExport';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const farmers = await prisma.farmer.findMany({
      include: { county: true, ward: true },
      take: 1000,
    });

    const csv = convertToCSV(formatFarmersForCSV(farmers));
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="smartshamba_farmers.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
