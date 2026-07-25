import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOtp } from '@/lib/otp';
import { sendNotification } from '@/lib/notifications';
import { otpTemplate } from '@/lib/notifications/templates';
import { checkRateLimit } from '@/lib/rateLimit';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { phone, role = 'FARMER' } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, {status: 400 });
    }

    const normalized = phone.trim().replace(/\s/g, '');
    if (!/^\+254\d{9}$/.test(normalized)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format: +254XXXXXXXXX' },
        { status: 400 }
      );
    }

    const rateCheck = checkRateLimit(`otp:${normalized}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateCheck.retryAfter}s.` },
        { status: 429 }
      );
    }

    let accountId: string | null = null;

    if (role === 'BUYER') {
      const buyer = await prisma.buyer.findFirst({ where: { phone: normalized } });
      if (!buyer) {
        return NextResponse.json(
          { error: 'No buyer account found for this number. Please register via USSD first.' },
          { status: 404 }
        );
      }
      accountId = buyer.id;
    } else {
      const farmer = await prisma.farmer.findUnique({ where: { phone: normalized } });
      if (!farmer) {
        return NextResponse.json(
          { error: 'No farmer account found for this number. Please register via USSD first.' },
          { status: 404 }
        );
      }
      accountId = farmer.id;
    }

    const { code, error } = await createOtp(normalized);
    if (error) {
      return NextResponse.json({ error }, { status: 429 });
    }

    const body = otpTemplate({ code: code!, expiresMinutes: 5 });

    await sendNotification({
      type:           'OTP',
      recipientPhone: normalized,
      body,
      farmerId:       role === 'FARMER' ? accountId ?? undefined : undefined,
      buyerId:        role === 'BUYER' ? accountId ?? undefined : undefined,
    }).catch((err) => {
      console.error('[OTP] SMS failed:', err);
    });

    console.log('[OTP] Code sent to:', normalized);
    if (process.env.LOG_OTP_IN_DEV === 'true') console.log('[OTP] DEV CODE:', code);
    return NextResponse.json({ success: true, message: 'OTP sent to your phone.' });
  } catch (error) {
    console.error('[OTP] Request error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
