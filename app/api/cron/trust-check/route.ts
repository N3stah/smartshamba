import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Running Trust & Risk Auto-Freeze check...');

    // 1. Find all TrustScore records below 20
    const lowTrustRecords = await prisma.trustScore.findMany({
      where: { score: { lt: 20 } },
      select: { userId: true, userType: true }
    });

    let totalFrozen = 0;

    for (const record of lowTrustRecords) {
      if (record.userType === 'FARMER') {
        // 2. Check if the farmer exists and is not already frozen
        const farmer = await prisma.farmer.findUnique({
          where: { id: record.userId },
          select: { id: true, isFrozen: true }
        });

        if (farmer && !farmer.isFrozen) {
          await prisma.farmer.update({
            where: { id: farmer.id },
            data: { isFrozen: true }
          });
          totalFrozen++;
        }
      } else if (record.userType === 'BUYER') {
        // 3. Check if the buyer exists and is not already frozen
        const buyer = await prisma.buyer.findUnique({
          where: { id: record.userId },
          select: { id: true, isFrozen: true }
        });

        if (buyer && !buyer.isFrozen) {
          await prisma.buyer.update({
            where: { id: buyer.id },
            data: { isFrozen: true }
          });
          totalFrozen++;
        }
      }
    }

    console.log(`[CRON] Auto-Froze ${totalFrozen} accounts.`);
    return NextResponse.json({ success: true, frozenCount: totalFrozen });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
