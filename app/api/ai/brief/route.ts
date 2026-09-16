import { NextRequest, NextResponse } from 'next/server';
import { getFarmerSession, getBuyerSession, requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { generateDailyBrief } from '@/lib/ai/brief-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    let role: 'FARMER' | 'BUYER' | 'ADMIN' | null = null;
    let phone: string | null = null;

    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    const isAdmin = !await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);

    if (farmerPhone) { role = 'FARMER'; phone = farmerPhone; }
    else if (buyerPhone) { role = 'BUYER'; phone = buyerPhone; }
    else if (isAdmin) { role = 'ADMIN'; phone = 'admin'; }

    if (!role || !phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cache for 1 hour to avoid spamming the AI
    const cacheKey = `brief-${role}-${phone}`;
    const brief = await generateDailyBrief(role, phone);

    return NextResponse.json({ success: true, brief });
  } catch (error) {
    console.error('[API] AI Brief error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
