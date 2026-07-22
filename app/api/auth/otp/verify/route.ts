import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import { setFarmerSessionCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const normalized = phone.trim().replace(/\s/g, '');

    // Rate limit OTP verification to prevent brute-force attacks
    const rateCheck = checkRateLimit(`otp-verify:${normalized}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many verification attempts. Please wait ${rateCheck.retryAfter}s.` },
        { status: 429 }
      );
    }

    const { valid, error } = await verifyOtp(normalized, code.trim());
    if (!valid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const farmer = await prisma.farmer.findUnique({
      where: { phone: normalized },
      select: { id: true, name: true, phone: true, location: true, county: true, ward: true },
    });

    if (!farmer) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, farmer });
    setFarmerSessionCookie(response, normalized);

    console.log('[OTP] Login successful:', normalized);
    return response;
  } catch (error) {
    console.error('[OTP] Verify error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
