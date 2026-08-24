import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Find by verificationId (UUID). Casting to any to bypass potential stale Prisma client cache.
    const contract = await ((prisma as any).contract.findUnique as any)({
      where: { verificationId: id },
      select: {
        id: true,
        status: true,
        farmerSigned: true,
        buyerSigned: true,
        farmerSignedAt: true,
        buyerSignedAt: true,
        terms: true,
        createdAt: true,
      }
    });

    if (!contract) return NextResponse.json({ error: 'Contract not found or invalid verification ID' }, { status: 404 });

    return NextResponse.json(contract);
  } catch (err) {
    console.error('[API] Verify contract error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
