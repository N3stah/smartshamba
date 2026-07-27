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

    const listing = await prisma.produceListing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const updated = await prisma.produceListing.update({
      where: { id },
      data: { status },
    });

    await recordAuditLog({
      action: `UPDATE_LISTING_STATUS_${status}`,
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'ProduceListing',
      entityId: id,
      before: { status: listing.status },
      after: { status },
    });

    return NextResponse.json({ success: true, listing: updated });
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
    const listing = await prisma.produceListing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    await prisma.produceListing.delete({ where: { id } });

    await recordAuditLog({
      action: 'DELETE_LISTING',
      actorType: 'ADMIN',
      actorId: req.headers.get('x-admin-key') || 'session-admin',
      entityType: 'ProduceListing',
      entityId: id,
      before: { product: listing.product, quantityBags: listing.quantityBags },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
