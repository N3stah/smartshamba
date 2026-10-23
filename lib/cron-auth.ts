import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifies that a cron request is authorized via CRON_SECRET.
 * Supports both `Authorization: Bearer <secret>` and `x-cron-secret: <secret>`.
 *
 * Returns null if auth passes (caller may proceed).
 * Returns a 401/503 NextResponse if auth fails (caller should return this immediately).
 *
 * Refuses to run if CRON_SECRET env var is unset — this prevents silent
 * unauthenticated execution in misconfigured environments.
 */
export function verifyCronAuth(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[cron-auth] CRON_SECRET is not set — refusing to run scheduled jobs.');
    return NextResponse.json(
      { error: 'Scheduler not configured' },
      { status: 503 }
    );
  }

  const presented = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.headers.get('x-cron-secret');

  if (presented !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null; // auth OK, caller may proceed
}
