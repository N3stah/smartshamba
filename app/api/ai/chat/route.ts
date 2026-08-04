import { NextRequest, NextResponse } from 'next/server';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';
import { handleChatMessage } from '@/lib/ai/chat-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    let role: 'FARMER' | 'BUYER' | 'ADMIN' | null = null;
    let phone: string | null = null;

    // Determine role and extract phone from session
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    const isAdmin = !requireAdminAuth(req);

    if (farmerPhone) { role = 'FARMER'; phone = farmerPhone; }
    else if (buyerPhone) { role = 'BUYER'; phone = buyerPhone; }
    else if (isAdmin) { role = 'ADMIN'; phone = 'admin'; }

    if (!role || !phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const responseText = await handleChatMessage(message, role, phone);
    return NextResponse.json({ success: true, response: responseText });
  } catch (error) {
    console.error('[API] AI Chat error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
