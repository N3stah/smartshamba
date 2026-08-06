import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransportSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';

export async function PUT(req: NextRequest) {
  try {
    const phone = getTransportSession(req);
    if (!phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const password = body?.password;
    
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    
    await prisma.transportProvider.update({ 
      where: { phone }, 
      data: { password: hashed } 
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Transport set password error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
