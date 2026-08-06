import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireAdminAuth } from '@/lib/auth';
import { streamChatResponse } from '@/lib/ai/copilot-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    let role: 'FARMER' | 'BUYER' | 'ADMIN' | null = null;
    let userId: string | null = null;

    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);
    const isAdmin = !requireAdminAuth(req);

    if (farmerPhone) {
      role = 'FARMER';
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      userId = farmer?.id ?? null;
    } else if (buyerPhone) {
      role = 'BUYER';
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      userId = buyer?.id ?? null;
    } else if (isAdmin) {
      role = 'ADMIN';
      userId = 'admin';
    }

    if (!role || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get or Create Conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.aIConversation.create({
        data: { userId, role, title: message.substring(0, 30) }
      });
      convId = conv.id;
    }

    // 2. Save User Message
    await prisma.aIMessage.create({
      data: { conversationId: convId, role: 'user', content: message }
    });

    // 3. Fetch History
    const history = await prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true }
    });

    // 4. Stream AI Response
    const aiStream = await streamChatResponse(message, role, userId, history as any);

    // 5. Intercept stream to assemble full text, check for actions, and save to DB
    const decoder = new TextDecoder();
    let fullAiText = '';
    
    const interceptStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk);
        fullAiText += text;
        controller.enqueue(chunk);
      },
      async flush() {
        if (fullAiText) {
          // Smart Action Interception (Check for [ACTION:...])
          if (fullAiText.startsWith('[ACTION:CREATE_LISTING:')) {
            try {
              const jsonStr = fullAiText.match(/\[ACTION:CREATE_LISTING:(.*?)\]/)![1];
              const params = JSON.parse(jsonStr);
              
              if (role === 'FARMER' && userId !== 'admin') {
                await prisma.produceListing.create({
                  data: {
                    farmerId: userId,
                    product: params.crop,
                    quantityBags: parseInt(params.bags),
                    pricePerBag: parseFloat(params.price)
                  }
                });
                fullAiText = "✅ Done! I've created the produce listing for you. You can view it in your 'Sell Produce' dashboard.";
              }
            } catch (parseError) {
              fullAiText = "I understood you want to create a listing, but I couldn't parse the details. Please use the 'Sell Produce' page to create it manually.";
            }
          }

          // Save the complete AI text to DB when stream finishes
          await prisma.aIMessage.create({
            data: { conversationId: convId!, role: 'ai', content: fullAiText }
          }).catch(dbErr => console.error('[AI] Failed to save AI message:', dbErr));
        }
      }
    });

    const pipedStream = aiStream.pipeThrough(interceptStream);

    return new NextResponse(pipedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Conversation-Id': convId,
      },
    });

  } catch (error) {
    console.error('[API] AI Chat error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
