import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import { setFarmerSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const normalized = phone.trim().replace(/\s/g, '');

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
