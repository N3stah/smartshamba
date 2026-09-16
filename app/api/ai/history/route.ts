import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);

    let userId: string | null = null;
    let role: string | null = null;

    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      if (farmer) { userId = farmer.id; role = 'FARMER'; }
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      if (buyer) { userId = buyer.id; role = 'BUYER'; }
    } else {
      const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
      if (!authError) {
        const staff = await getStaffSession(req);
        if (staff) { userId = staff.id; role = 'STAFF'; }
      }
    }

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Strict scoping by userId AND role to prevent any cross-user leakage
    const conversations = await prisma.aiConversation.findMany({
      where: { userId, role },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { 
        messages: { 
          orderBy: { createdAt: 'asc' } 
        } 
      }
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[API] AI History error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
