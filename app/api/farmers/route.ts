import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const farmers = await prisma.farmer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        phone: true,
        name: true,
        location: true,
        createdAt: true,
      },
    });

    return NextResponse.json(farmers);
  } catch (error) {
    console.error('[FARMERS_API]', error);
    return NextResponse.json(
      { error: 'Failed to fetch farmers' },
      { status: 500 }
    );
  }
}
