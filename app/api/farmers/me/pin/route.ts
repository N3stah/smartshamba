import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';

export async function PUT(req: NextRequest) {
  try {
    const phone = getFarmerSession(req);
    if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { pin } = await req.json();
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }
    
    const hashedPin = await bcrypt.hash(pin, 10);
    await prisma.farmer.update({
      where: { phone },
      data: {
        pin: hashedPin,
        pinFailedAttempts: 0,
        pinLockedUntil: null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
