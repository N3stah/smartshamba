import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setTransportSessionCookie } from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    
    const provider = await prisma.transportProvider.findUnique({ where: { phone } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const { valid, error } = await verifyOtp(phone, code.trim());
    if (!valid) {
      return NextResponse.json({ error: error ?? 'Invalid code' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, provider });
    setTransportSessionCookie(res, phone);
    return res;
  } catch (error) {
    console.error('[AUTH] Transport login error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
