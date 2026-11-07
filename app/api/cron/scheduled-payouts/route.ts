import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Real payouts require the S3 PROCESSING-state and Daraja callback design.
    return NextResponse.json(
      { disabled: true, reason: 'payouts disabled pending real M-PESA B2C integration' },
      { status: 200 },
    );

  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
