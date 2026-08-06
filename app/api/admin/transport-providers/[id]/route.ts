import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    
    const updateData: any = {};
    if (body.verified !== undefined) updateData.verified = body.verified;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.name) updateData.name = body.name;
    if (body.ratePerKm) updateData.ratePerKm = parseFloat(body.ratePerKm);

    const provider = await prisma.transportProvider.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('[API] Update transport provider error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
