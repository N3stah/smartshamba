import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;

    const [farmers, buyers, warehouses] = await Promise.all([
      prisma.farmer.findMany({ where: { latitude: { not: null } }, select: { id: true, name: true, latitude: true, longitude: true } }),
      prisma.buyer.findMany({ where: { latitude: { not: null } }, select: { id: true, name: true, latitude: true, longitude: true } }),
      prisma.warehouse.findMany({ select: { id: true, name: true, latitude: true, longitude: true } })
    ]);

    return NextResponse.json({ farmers, buyers, warehouses });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
