import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import { setFarmerSessionCookie, setBuyerSessionCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { phone, code, role = 'FARMER' } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const normalized = phone.trim().replace(/\s/g, '');

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

    const response = NextResponse.json({ success: true });

    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findFirst({ where: { phone: normalized } });
      if (!buyer) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      setBuyerSessionCookie(response, normalized);
      
      const hasTransactions = await prisma.transaction.count({ where: { buyerId: buyer.id } });
      const hasDemands = await prisma.buyerDemand.count({ where: { buyerId: buyer.id } });
      const redirectTo = (hasTransactions > 0 || hasDemands > 0) ? '/buyer/dashboard' : '/buyer/demands';
      
      console.log('[OTP] Buyer login successful:', normalized);
      return NextResponse.json({ success: true, redirectTo });
    } else {
      const farmer = await prisma.farmer.findUnique({ where: { phone: normalized } });
      if (!farmer) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      setFarmerSessionCookie(response, normalized);
      
      const hasTransactions = await prisma.transaction.count({ where: { farmerId: farmer.id } });
      const hasLocation = farmer.location || farmer.countyId;
      const redirectTo = (hasTransactions > 0 || hasLocation) ? '/dashboard' : '/dashboard/settings';
      
      console.log('[OTP] Farmer login successful:', normalized);
      return NextResponse.json({ success: true, redirectTo });
    }

  } catch (error) {
    console.error('[OTP] Verify error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
