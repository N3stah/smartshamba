import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get('county');
  
  const where: { county?: string } = {};
  if (county) where.county = county;
  
  const alerts = await prisma.weatherAlert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return NextResponse.json({ alerts });
}
