import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const templates = await prisma.contractTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name, category, clauses } = body;

    if (!name || !clauses || !Array.isArray(clauses)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = await prisma.contractTemplate.create({
      data: { name, content: JSON.stringify(clauses || category) }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
