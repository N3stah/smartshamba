import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession } from '@/lib/auth';
import { signContract } from '@/lib/contracts/contract-service';
import * as Sentry from '@sentry/nextjs';

// GET contract details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contract = await (prisma as any).contract.findUnique({
      where: { transactionId: id }
    });

    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    return NextResponse.json(contract);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST sign contract
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { signatureName } = await req.json();

    if (!signatureName) return NextResponse.json({ error: 'Signature name is required' }, { status: 400 });

    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);

    let userType: 'FARMER' | 'BUYER' | null = null;
    if (farmerPhone) userType = 'FARMER';
    else if (buyerPhone) userType = 'BUYER';

    if (!userType) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contract = await signContract(id, userType, signatureName, farmerPhone || buyerPhone || 'unknown');
    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error('[API] Contract sign error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
