import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// GET /api/advisories — public, returns active advisories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countyId = searchParams.get('countyId');
    const now      = new Date();

    const advisories = await prisma.advisory.findMany({
      where: {
        active:    true,
        startDate: { lte: now },
        endDate:   { gte: now },
        ...(countyId ? { OR: [{ countyId }, { countyId: null }] } : {}),
      },
      include: { county: { select: { name: true } } },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(advisories);
  } catch (error) {
    console.error('[NOTIFICATIONS] GET advisories error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/advisories — admin creates an advisory
export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (auth) return auth;

  try {
    const { title, message, countyId, startDate, endDate, active } = await req.json();

    if (!title?.trim() || !message?.trim() || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'title, message, startDate and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json(
        { error: 'Invalid dates — endDate must be after startDate' },
        { status: 400 }
      );
    }

    const advisory = await prisma.advisory.create({
      data: {
        title:    title.trim(),
        message:  message.trim(),
        countyId: countyId ?? null,
        startDate: start,
        endDate:   end,
        active:   active ?? true,
      },
      include: { county: { select: { name: true } } },
    });

    console.log('[NOTIFICATIONS] Advisory created:', advisory.id, advisory.title);
    return NextResponse.json(advisory, { status: 201 });
  } catch (error) {
    console.error('[NOTIFICATIONS] POST advisory error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}