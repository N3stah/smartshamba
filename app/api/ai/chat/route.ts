import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession, getBuyerSession, requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { streamChatResponse } from '@/lib/ai/copilot-service';
import { checkApiRateLimit } from '@/lib/rateLimit';
import { processAIAction } from '@/lib/ai/actions';
import { SmartShambaRole } from '@/lib/ai/actions/types';
import { AIMessage } from '@/lib/ai/providers/ai-provider';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    let role: string | null = null;
    let userId: string | null = null;
    let staffRole: StaffRole | undefined = undefined;

    // 1. Resolve Identity (Farmer -> Buyer -> Staff)
    const farmerPhone = getFarmerSession(req);
    const buyerPhone = getBuyerSession(req);

    if (farmerPhone) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: farmerPhone } });
      if (farmer) { userId = farmer.id; role = 'FARMER'; }
    } else if (buyerPhone) {
      const buyer = await prisma.buyer.findFirst({ where: { phone: buyerPhone } });
      if (buyer) { userId = buyer.id; role = 'BUYER'; }
    } else {
      // Staff RBAC Check
      const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
      if (!authError) {
        const staff = await getStaffSession(req);
        if (staff) { userId = staff.id; role = 'STAFF'; staffRole = staff.role as StaffRole; }
      }
    }

    if (!role || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1.5 AI Rate Limiting (Check before expensive AI work)
    const isStaff = role === 'STAFF';
    const limit = isStaff ? parseInt(process.env.AI_CHAT_LIMIT_STAFF || '100') : parseInt(process.env.AI_CHAT_LIMIT_USER || '20');
    const windowMs = parseInt(process.env.AI_CHAT_WINDOW_MS || '3600000'); // 1 hour default
    
    if (limit > 0 && windowMs > 0) {
      const identifier = isStaff ? `ai:chat:staff:${userId}` : `ai:chat:user:${userId}`;
      const rateLimit = await checkApiRateLimit(identifier, limit, windowMs);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
          { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 0) } }
        );
      }
    }

    // 2. Get or Create AI Conversation + Verify Ownership
    let convId = conversationId;
    if (convId) {
      const existingConv = await prisma.aiConversation.findUnique({ where: { id: convId } });
      if (!existingConv || existingConv.userId !== userId || existingConv.role !== role) {
        return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 403 });
      }
    } else {
      const conv = await prisma.aiConversation.create({
        data: { userId, role, title: message.substring(0, 30) }
      });
      convId = conv.id;
    }

    // 3. Save User Message
    await prisma.aiMessage.create({
      data: { conversationId: convId, role: 'user', content: message }
    });

    // 4. Fetch History
    const dbHistory = await prisma.aiMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Map to typed AIMessage
    const history: AIMessage[] = dbHistory.reverse().map(h => ({
      role: h.role === 'ai' ? 'assistant' : 'user',
      content: h.content
    }));

    // 5. Stream AI Response
    const aiStream = await streamChatResponse(message, role, userId, history, staffRole);

    // 6. Intercept stream to assemble full text, check for actions, and save to DB
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullAiText = '';
    let isActionBuffer = false;
    
    const interceptStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk);
        fullAiText += text;
        
        // If we know it's an action, buffer it. Don't send to client.
        if (isActionBuffer) return;
        
        // If it starts with [ACTION:, start buffering
        if (fullAiText.startsWith('[ACTION:')) {
          isActionBuffer = true;
          return;
        }
        
        // Otherwise, pass through
        controller.enqueue(chunk);
      },
      async flush(controller) { // Explicitly declare controller
        if (fullAiText) {
          let finalText = fullAiText;
          
          if (isActionBuffer) {
            const context = { userId: userId!, role: role as SmartShambaRole };
            const actionResult = await processAIAction(fullAiText, context);
            if (actionResult) {
              finalText = actionResult;
              // Enqueue the final processed text now
              controller.enqueue(encoder.encode(finalText));
            } else {
              // Fallback if action parsing failed somehow
              controller.enqueue(encoder.encode(finalText));
            }
          }

          // Save the complete AI text to DB when stream finishes
          await prisma.aiMessage.create({
            data: { conversationId: convId!, role: 'ai', content: finalText }
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
