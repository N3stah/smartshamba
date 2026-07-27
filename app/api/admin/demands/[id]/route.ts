import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/auditLog';
import * as Sentry from '@sentry/nextjs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const { status } = body; // 'CLOSED', 'ACTIVE'

    if (!['CLOSED', 'ACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const demand = await prisma.buyerDemand.findUnique({ where: { id } });
    if (!demand) return NextResponse.json({ error: 'Demand not found' }, { status: 404 });

    const updated = await prisma.buyerDemand.update({
      where: { id },
      data: { status },
    });

    await recordAuditLog({
      action: `UPDATE_DEMAND_STATUS_${status}`,
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'BuyerDemand',
      entityId: id,
      before: { status: demand.status },
      after: { status },
    });

    return NextResponse.json({ success: true, demand: updated });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const demand = await prisma.buyerDemand.findUnique({ where: { id } });
    if (!demand) return NextResponse.json({ error: 'Demand not found' }, { status: 404 });

    await prisma.buyerDemand.delete({ where: { id } });

    await recordAuditLog({
      action: 'DELETE_DEMAND',
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'BuyerDemand',
      entityId: id,
      before: { product: demand.product, quantityBags: demand.quantityBags },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
