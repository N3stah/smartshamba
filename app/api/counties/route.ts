import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const counties = await prisma.county.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
    return NextResponse.json(counties);
  } catch (error) {
    console.error('[COUNTIES] GET error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
