import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, getStaffSession } from '@/lib/auth';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticator } = require('otplib');
import QRCode from 'qrcode';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    const session = await getStaffSession(req);
    if (!session || session.id === 'legacy-admin') {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });
    }

    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    // Generate a new TOTP secret
    const secret = authenticator.generateSecret();
    
    // Save the secret to the database (mfaEnabled remains false until verified)
    await prisma.staff.update({
      where: { id: staff.id },
      data: { totpSecret: secret }
    });

    // Generate the otpauth URI for the QR code
    const otpauthUrl = authenticator.keyuri(staff.email, 'SmartShamba Executive', secret);
    
    // Convert to a base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return NextResponse.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('[MFA] Setup error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
