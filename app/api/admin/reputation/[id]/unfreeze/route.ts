import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole, TrustUserType } from '@prisma/client';
import { recordTrustEvent } from '@/lib/reputation/trust-event-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CTO]);
    if (authError) return authError;

    const staff = await getStaffSession(req);
    if (!staff || staff.id === 'legacy-admin') {
      return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });
    }

    const { id: userId } = await params;
    const { userType, reason } = await req.json();

    if (!userType || !reason || reason.length < 10) {
      return NextResponse.json({ error: 'userType and a valid reason (min 10 chars) are required' }, { status: 400 });
    }

    if (userType === 'FARMER') {
      await prisma.farmer.update({
        where: { id: userId },
        data: { isFrozen: false, frozenReason: null, frozenAt: null }
      });
    } else if (userType === 'BUYER') {
      await prisma.buyer.update({
        where: { id: userId },
        data: { isFrozen: false, frozenReason: null, frozenAt: null }
      });
    } else {
      return NextResponse.json({ error: 'Cannot unfreeze this user type' }, { status: 400 });
    }

    await recordTrustEvent({
      userId,
      userType: userType as TrustUserType,
      eventType: 'ACCOUNT_UNFROZEN',
      impact: 5,
      description: `Account manually unfrozen by CTO. Reason: ${reason}`,
      relatedId: staff.id,
    });

    await prisma.auditLog.create({
      data: {
        action: 'TRUST_ACCOUNT_UNFROZEN',
        actorType: 'STAFF',
        actorId: staff.id,
        staffId: staff.id,
        entityType: 'User',
        entityId: userId,
        after: { userType, reason }
      }
    });

    return NextResponse.json({ success: true, message: 'Account unfrozen successfully' });
  } catch (error) {
    console.error('[API] Unfreeze error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
