import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticator } = require('otplib');
import * as Sentry from '@sentry/nextjs';

const COOKIE_NAME = 'smartshamba_admin';
const SESSION_DURATION = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest) {
  try {
    const { email, password, mfaCode } = await req.json();

    // 1. Backward Compatibility: Legacy Admin API Key Login (if email is not provided)
    if (!email && password === process.env.ADMIN_API_KEY) {
      const response = NextResponse.json({ success: true, role: 'ADMIN' });
      response.cookies.set(COOKIE_NAME, process.env.ADMIN_API_KEY!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: SESSION_DURATION,
      });
      return response;
    }

    // 2. Staff Database Login
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({ where: { email: email.toLowerCase() } });
    if (!staff || !staff.active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, staff.passwordHash);
    if (!isValid) {
      console.warn(`[AUTH] Failed login attempt for ${email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // MFA Enforcement: If enabled, verify the 6-digit code
    if (staff.mfaEnabled && staff.totpSecret) {
      if (!mfaCode) {
        return NextResponse.json({ error: 'MFA code required', mfaRequired: true }, { status: 401 });
      }
      const isValidMfa = authenticator.verify({ token: mfaCode, secret: staff.totpSecret });
      if (!isValidMfa) {
        return NextResponse.json({ error: 'Invalid MFA code', mfaRequired: true }, { status: 401 });
      }
    }

    const response = NextResponse.json({ success: true, role: staff.role });
    
    // Set session cookie to Staff ID
    response.cookies.set(COOKIE_NAME, staff.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION,
    });

    console.log(`[AUTH] Staff login successful: ${staff.email} (${staff.role})`);
    return response;
  } catch (error) {
    console.error('[AUTH] Login error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
