import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const county = await prisma.county.findUnique({ where: { id } });
    if (!county) {
      return NextResponse.json({ error: 'County not found' }, { status: 404 });
    }

    const wards = await prisma.ward.findMany({
      where: { countyId: id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    return NextResponse.json(wards);
  } catch (error) {
    console.error('[COUNTIES] GET wards error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
