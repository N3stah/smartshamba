import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { sendPushNotification } from '@/lib/push';
import * as Sentry from '@sentry/nextjs';

async function getAuthorizedUserAndTransaction(req: NextRequest, transactionId: string, role: string | null) {
  const farmerPhone = getFarmerSession(req);
  const buyerPhone = getBuyerSession(req);

  if (!farmerPhone && !buyerPhone) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { 
      farmer: { select: { phone: true, id: true, name: true } }, 
      buyer: { select: { phone: true, id: true, name: true } } 
    },
  });

  if (!transaction) return { error: NextResponse.json({ error: 'Transaction not found' }, { status: 404 }) };

  let userType: 'FARMER' | 'BUYER' | null = null;
  let userId: string | null = null;

  // Prioritize the role passed from the frontend to avoid cookie conflicts
  if (role === 'BUYER' && buyerPhone && transaction.buyer.phone === buyerPhone) {
    userType = 'BUYER';
    userId = transaction.buyer.id;
  } else if (role === 'FARMER' && farmerPhone && transaction.farmer.phone === farmerPhone) {
    userType = 'FARMER';
    userId = transaction.farmer.id;
  } else if (farmerPhone && transaction.farmer.phone === farmerPhone) {
    userType = 'FARMER';
    userId = transaction.farmer.id;
  } else if (buyerPhone && transaction.buyer.phone === buyerPhone) {
    userType = 'BUYER';
    userId = transaction.buyer.id;
  }

  if (!userType || !userId) return { error: NextResponse.json({ error: 'Forbidden: You are not part of this transaction' }, { status: 403 }) };

  return { transaction, userType, userId };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: transactionId } = await params;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // Get role from query param

    const auth = await getAuthorizedUserAndTransaction(req, transactionId, role);
    if ('error' in auth) return auth.error;

    const conversation = await prisma.conversation.findUnique({
      where: { transactionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    const messages = conversation?.messages || [];

    // Fetch sender names
    const farmerIds = messages.filter(m => m.senderType === 'FARMER').map(m => m.senderId);
    const buyerIds = messages.filter(m => m.senderType === 'BUYER').map(m => m.senderId);

    const farmers = await prisma.farmer.findMany({ where: { id: { in: farmerIds } }, select: { id: true, name: true } });
    const buyers = await prisma.buyer.findMany({ where: { id: { in: buyerIds } }, select: { id: true, name: true } });

    const farmerMap = new Map(farmers.map(f => [f.id, f.name]));
    const buyerMap = new Map(buyers.map(b => [b.id, b.name]));

    const messagesWithName = messages.map(m => ({
      ...m,
      senderName: m.senderType === 'FARMER' ? (farmerMap.get(m.senderId) ?? 'Farmer') : (buyerMap.get(m.senderId) ?? 'Buyer')
    }));

    return NextResponse.json(messagesWithName);
  } catch (error) {
    console.error('[CHAT] Error fetching messages:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: transactionId } = await params;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // Get role from query param

    const auth = await getAuthorizedUserAndTransaction(req, transactionId, role);
    if ('error' in auth) return auth.error;

    const { transaction, userType, userId } = auth;
    const { body } = await req.json();

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: (await prisma.conversation.upsert({
          where: { transactionId },
          update: {},
          create: { transactionId },
        })).id,
        senderId: userId!,
        senderType: userType!,
        body: body.trim(),
      },
    });

    // Notify the other party
    const recipientPhone = userType === 'FARMER' ? transaction.buyer.phone : transaction.farmer.phone;
    const senderName = userType === 'FARMER' ? transaction.farmer.name : transaction.buyer.name;

    if (recipientPhone) {
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone,
        body: `SmartShamba: New message from ${senderName ?? 'User'} regarding Ref: ${transaction.reference}. Check your dashboard.`,
        farmerId: userType === 'BUYER' ? transaction.farmer.id : undefined,
        buyerId: userType === 'FARMER' ? transaction.buyer.id : undefined,
      }).catch(err => console.error('[CHAT] Notification failed:', err));
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('[CHAT] Error sending message:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
