import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAndSaveTrustScore } from '@/lib/reputation/reputation-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Syncing reputation scores via canonical service...');

    const [farmers, buyers, providers] = await Promise.all([
      prisma.farmer.findMany({ select: { id: true } }),
      prisma.buyer.findMany({ select: { id: true } }),
      prisma.transportProvider.findMany({ select: { id: true } })
    ]);

    let syncedCount = 0;

    // Calculate for Farmers
    for (const farmer of farmers) {
      try {
        await calculateAndSaveTrustScore(farmer.id, 'FARMER');
        syncedCount++;
      } catch (e) {
        console.error(`[CRON] Failed to sync farmer ${farmer.id}:`, e);
      }
    }

    // Calculate for Buyers
    for (const buyer of buyers) {
      try {
        await calculateAndSaveTrustScore(buyer.id, 'BUYER');
        syncedCount++;
      } catch (e) {
        console.error(`[CRON] Failed to sync buyer ${buyer.id}:`, e);
      }
    }

    // Calculate for Transport Providers
    for (const provider of providers) {
      try {
        await calculateAndSaveTrustScore(provider.id, 'TRANSPORT');
        syncedCount++;
      } catch (e) {
        console.error(`[CRON] Failed to sync provider ${provider.id}:`, e);
      }
    }

    console.log(`[CRON] Reputation sync complete. Synced ${syncedCount} users.`);
    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error('[CRON] Reputation sync error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
