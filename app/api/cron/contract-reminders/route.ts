import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Checking for pending contract signatures...');
    
    // Find DRAFT contracts older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingContracts = await prisma.contract.findMany({
      where: {
        status: 'DRAFT',
        createdAt: { lte: twentyFourHoursAgo }
      },
      include: {
        transaction: { include: { farmer: true, buyer: true } }
      }
    });

    for (const contract of pendingContracts) {
      if (!contract.farmerSigned && contract.transaction?.farmer?.phone) {
        await sendNotification({
          type: 'TRANSACTION_CONFIRMATION',
          recipientPhone: contract.transaction.farmer.phone,
          body: `SmartShamba Reminder: You have a pending contract to sign for Tx ${contract.transaction.reference.substring(0, 8)}. Dial *384*53374# or visit the website to sign.`,
          farmerId: contract.transaction.farmer.id
        }).catch(()=>{});
      }
      if (!contract.buyerSigned && contract.transaction?.buyer?.phone) {
        await sendNotification({
          type: 'TRANSACTION_CONFIRMATION',
          recipientPhone: contract.transaction.buyer.phone,
          body: `SmartShamba Reminder: You have a pending contract to sign for Tx ${contract.transaction.reference.substring(0, 8)}. Please visit the website to sign.`,
          buyerId: contract.transaction.buyer.id
        }).catch(()=>{});
      }
    }

    console.log(`[CRON] Sent ${pendingContracts.length} contract reminders.`);
    return NextResponse.json({ success: true, sent: pendingContracts.length });
  } catch (error) {
    console.error('[CRON] Contract reminders error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
