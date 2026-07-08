import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOtp } from '@/lib/otp';
import { sendSms } from '@/lib/sms';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalized = phone.trim().replace(/\s/g, '');
    if (!/^\+254\d{9}$/.test(normalized)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format: +254XXXXXXXXX' },
        { status: 400 }
      );
    }

    // Rate limit per phone
    const rateCheck = checkRateLimit(`otp:${normalized}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateCheck.retryAfter}s.` },
        { status: 429 }
      );
    }

    // Check farmer exists
    const farmer = await prisma.farmer.findUnique({ where: { phone: normalized } });
    if (!farmer) {
      return NextResponse.json(
        { error: 'No account found for this number. Please register via USSD first by dialling *384*53374#.' },
        { status: 404 }
      );
    }

    const { code, error } = await createOtp(normalized);
    if (error) {
      return NextResponse.json({ error }, { status: 429 });
    }

    const message = `SmartShamba: Your login code is ${code}. Valid for 5 minutes. Do not share this code.`;
    await sendSms(normalized, message).catch((err) => {
      console.error('[OTP] SMS failed:', err);
    });

    console.log('[OTP] Code sent to:', normalized);
    return NextResponse.json({ success: true, message: 'OTP sent to your phone.' });
  } catch (error) {
    console.error('[OTP] Request error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
