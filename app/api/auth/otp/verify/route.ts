import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: { phone, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

    const farmer = await prisma.farmer.findUnique({ where: { phone } });
    const buyer = await prisma.buyer.findFirst({ where: { phone } });

    let cookieName = '';
    let redirectTo = '';

    if (farmer) {
      cookieName = 'smartshamba_farmer';
      redirectTo = '/dashboard';
    } else if (buyer) {
      cookieName = 'smartshamba_buyer';
      redirectTo = '/buyer/dashboard';
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // FIX: Create the response object FIRST, then set the cookie on it, then return it.
    const response = NextResponse.json({ success: true, redirectTo });
    response.cookies.set(cookieName, phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 hours
    });

    return response;
  } catch (error) {
    console.error('[API] OTP Verify error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
