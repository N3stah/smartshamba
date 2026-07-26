import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, password, role = 'FARMER' } = await req.json();
    if (!phone || !otp || !password) {
      return NextResponse.json({ error: 'Phone, OTP, and new password are required' }, { status: 400 });
    }

    // Verify the OTP first
    const { valid, error } = await verifyOtp(phone, otp);
    if (!valid) {
      return NextResponse.json({ error: error ?? 'Invalid OTP' }, { status: 401 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const normalized = phone.trim().replace(/\s/g, '');

    if (role === 'BUYER') {
      await prisma.buyer.updateMany({ where: { phone: normalized }, data: { password: hashed } });
    } else {
      await prisma.farmer.update({ where: { phone: normalized }, data: { password: hashed } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Reset password error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
