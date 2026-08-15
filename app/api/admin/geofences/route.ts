import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const geofences = await prisma.geofence.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(geofences);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const { name, type, polygon } = await req.json();
    if (!name || !type || !polygon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const geofence = await prisma.geofence.create({
      data: { name, type, polygon }
    });

    return NextResponse.json(geofence, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
