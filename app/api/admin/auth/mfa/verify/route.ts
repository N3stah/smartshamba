import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticator } = require('otplib');
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
    if (authError) return authError;

    const session = await getStaffSession(req);
    if (!session || session.id === 'legacy-admin') {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });
    }

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'MFA token is required' }, { status: 400 });

    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    if (!staff.totpSecret) return NextResponse.json({ error: 'MFA setup not initiated' }, { status: 400 });

    // Verify the token against the stored secret
    const isValid = authenticator.verify({ token, secret: staff.totpSecret });
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid MFA token' }, { status: 401 });
    }

    // Enable MFA for the user
    await prisma.staff.update({
      where: { id: staff.id },
      data: { mfaEnabled: true }
    });

    // Audit the MFA activation
    await prisma.auditLog.create({
      data: {
        action: 'MFA_ENABLED',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'Staff',
        entityId: staff.id
      }
    }).catch(e => console.error('[AUDIT]', e));

    return NextResponse.json({ success: true, message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('[MFA] Verify error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
