import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, mfaCode } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Verify password against the universal ADMIN_API_KEY
    if (password !== process.env.ADMIN_API_KEY) {
      console.warn(`[AUTH] Failed login attempt for ${email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const staff = await prisma.staff.findUnique({ where: { email } });
    if (!staff || !staff.active) {
      console.warn(`[AUTH] Failed login attempt for ${email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // MFA Enforcement (if enabled)
    if (staff.mfaEnabled && staff.totpSecret) {
      if (!mfaCode) {
        return NextResponse.json({ error: 'MFA code required', mfaRequired: true }, { status: 401 });
      }
      // Verify TOTP code
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { authenticator } = require('otplib');
      const isValidMfa = authenticator.verify({ token: mfaCode, secret: staff.totpSecret });
      if (!isValidMfa) {
        return NextResponse.json({ error: 'Invalid MFA code', mfaRequired: true }, { status: 401 });
      }
    }

    const response = NextResponse.json({ success: true, role: staff.role });
    response.cookies.set('smartshamba_admin', staff.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 hours
    });

    return response;
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
