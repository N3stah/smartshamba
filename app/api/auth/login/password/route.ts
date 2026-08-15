import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setFarmerSessionCookie, setBuyerSessionCookie } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { phone, password, role = 'FARMER' } = await req.json();
    if (!phone || !password) return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });

    const normalized = phone.trim().replace(/\s/g, '');
    
    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findFirst({ where: { phone: normalized } });
      if (!buyer || !buyer.password) return NextResponse.json({ error: 'Invalid credentials or password not set' }, { status: 401 });
      
      const valid = await bcrypt.compare(password, buyer.password);
      if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      
      const res = NextResponse.json({ success: true });
      setBuyerSessionCookie(res, normalized);
      return res;
    } else {
      const farmer = await prisma.farmer.findUnique({ where: { phone: normalized } });
      if (!farmer || !farmer.password) return NextResponse.json({ error: 'Invalid credentials or password not set' }, { status: 401 });
      
      const valid = await bcrypt.compare(password, farmer.password);
      if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      
      const res = NextResponse.json({ success: true });
      setFarmerSessionCookie(res, normalized);
      return res;
    }
  } catch (error) {
    console.error('[AUTH] Password login error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
