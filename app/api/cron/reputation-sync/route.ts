import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Syncing reputation scores...');

    const [farmers, buyers] = await Promise.all([
      prisma.farmer.findMany({ select: { id: true } }),
      prisma.buyer.findMany({ select: { id: true } })
    ]);

    let syncedCount = 0;

    for (const farmer of farmers) {
      const [completedTx, totalTx] = await Promise.all([
        prisma.transaction.count({ where: { farmerId: farmer.id, status: 'SETTLED' } }),
        prisma.transaction.count({ where: { farmerId: farmer.id } })
      ]);

      const successRate = totalTx > 0 ? (completedTx / totalTx) * 100 : 0;
      const score = Math.min(100, Math.round(successRate));
      const level = score > 80 ? 'PLATINUM' : score > 60 ? 'GOLD' : score > 40 ? 'SILVER' : 'BRONZE';

      await (prisma as any).trustScore.upsert({
        where: { userId_userType: { userId: farmer.id, userType: 'FARMER' } },
        update: { score, level },
        create: { 
          userId: farmer.id, 
          userType: 'FARMER', 
          score, 
          level,
          breakdown: { successRate, totalTx, completedTx }
        }
      });
      syncedCount++;
    }

    for (const buyer of buyers) {
      const [completedTx, totalTx] = await Promise.all([
        prisma.transaction.count({ where: { buyerId: buyer.id, status: 'SETTLED' } }),
        prisma.transaction.count({ where: { buyerId: buyer.id } })
      ]);

      const successRate = totalTx > 0 ? (completedTx / totalTx) * 100 : 0;
      const score = Math.min(100, Math.round(successRate));
      const level = score > 80 ? 'PLATINUM' : score > 60 ? 'GOLD' : score > 40 ? 'SILVER' : 'BRONZE';

      await (prisma as any).trustScore.upsert({
        where: { userId_userType: { userId: buyer.id, userType: 'BUYER' } },
        update: { score, level },
        create: { 
          userId: buyer.id, 
          userType: 'BUYER', 
          score, 
          level,
          breakdown: { successRate, totalTx, completedTx }
        }
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error('[CRON] Reputation sync error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
