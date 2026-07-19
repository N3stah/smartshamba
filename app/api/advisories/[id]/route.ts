import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// PUT /api/advisories/[id] — admin updates an advisory
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body   = await req.json();

    const existing = await prisma.advisory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Advisory not found' }, { status: 404 });

    const start = body.startDate ? new Date(body.startDate) : existing.startDate;
    const end   = body.endDate   ? new Date(body.endDate)   : existing.endDate;

    if (end <= start) {
      return NextResponse.json(
        { error: 'endDate must be after startDate' },
        { status: 400 }
      );
    }

    const updated = await prisma.advisory.update({
      where: { id },
      data: {
        title:     body.title?.trim()   ?? existing.title,
        message:   body.message?.trim() ?? existing.message,
        countyId:  'countyId' in body ? (body.countyId ?? null) : existing.countyId,
        startDate: start,
        endDate:   end,
        active:    typeof body.active === 'boolean' ? body.active : existing.active,
      },
      include: { county: { select: { name: true } } },
    });

    console.log('[NOTIFICATIONS] Advisory updated:', id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[NOTIFICATIONS] PUT advisory error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/advisories/[id] — admin deletes an advisory
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const existing = await prisma.advisory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Advisory not found' }, { status: 404 });

    await prisma.advisory.delete({ where: { id } });
    console.log('[NOTIFICATIONS] Advisory deleted:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NOTIFICATIONS] DELETE advisory error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}