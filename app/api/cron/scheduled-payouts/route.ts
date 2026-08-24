import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { postLedgerEntry } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Processing scheduled payouts...');

    const pendingRequests = await (prisma as any).withdrawalRequest.findMany({
      where: { 
        status: 'PENDING',
        createdAt: { lte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    });

    let processedCount = 0;

    for (const req of pendingRequests) {
      try {
        const updatedReq = await (prisma as any).withdrawalRequest.update({
          where: { id: req.id },
          data: { 
            status: 'COMPLETED', 
            processedAt: new Date(),
            mpesaRef: `AUTO-PAYOUT-${req.id.substring(0, 8)}`
          }
        });

        await postLedgerEntry({
          userId: req.userId,
          userType: req.userType,
          entryType: 'DEBIT',
          amount: req.amount,
          reference: `WDL-${updatedReq.mpesaRef}`,
          description: 'Automated Withdrawal Payout'
        });

        processedCount++;
      } catch (error) {
        Sentry.captureException(error);
      }
    }

    console.log(`[CRON] Processed ${processedCount} payouts.`);
    return NextResponse.json({ success: true, processedCount });

  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
