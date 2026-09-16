import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { convertToCSV, formatFarmersForCSV } from '@/lib/csvExport';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
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
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
