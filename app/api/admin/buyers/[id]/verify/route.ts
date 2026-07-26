import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;
    
    const { id } = await params;
    const buyer = await prisma.buyer.findUnique({ where: { id } });
    if (!buyer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const updated = await prisma.buyer.update({ where: { id }, data: { verified: !buyer.verified } });
    return NextResponse.json({ success: true, verified: updated.verified });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
