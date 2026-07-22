import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

/**
 * Lightweight polling endpoint for farmer dashboard data sync.
 * Returns only updated timestamps and transaction statuses so the
 * frontend can detect USSD-originated changes without full page refresh.
 */
export async function GET(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: { 
        id: true,
        transactions: {
          select: { 
            id: true, 
            status: true,
            reference: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    // Check for group transactions if farmer is in any groups
    const groupMemberships = await prisma.groupMember.findMany({
      where: { farmerId: farmer.id },
      select: { 
        groupId: true,
        group: {
          select: {
            id: true,
            name: true,
            transactions: {
              select: { 
                id: true, 
                status: true,
                reference: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    return NextResponse.json({
      transactions: farmer.transactions,
      groups: groupMemberships.map(m => ({
        id: m.group.id,
        name: m.group.name,
        transactions: m.group.transactions,
      })),
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TRANSACTIONS] Sync error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
