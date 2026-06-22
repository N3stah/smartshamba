import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    throw new Error('SmartShamba Sentry Test');
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);

    return NextResponse.json({
      success: true,
      message: 'Error sent to Sentry'
    });
  }
}