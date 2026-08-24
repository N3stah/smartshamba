// @ts-nocheck
// TODO: V2 - Re-enable type checking after Stage 6/7 schema is built
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const [farmers, buyers, warehouses] = await Promise.all([
      prisma.farmer.findMany({ where: { latitude: { not: null } }, select: { id: true, name: true, latitude: true, longitude: true } }),
      prisma.buyer.findMany({ where: { latitude: { not: null } }, select: { id: true, name: true, latitude: true, longitude: true } }),
      (prisma as any).warehouse.findMany({ select: { id: true, name: true, latitude: true, longitude: true } })
    ]);

    return NextResponse.json({ farmers, buyers, warehouses });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
