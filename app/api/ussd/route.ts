import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { con, end } from '@/lib/africastalking';
import { checkRateLimit } from '@/lib/rateLimit';
import { getUssdText } from '@/lib/ussd/i18n';
import { menuTree } from '@/lib/ussd/menu-tree';
import { USSD_STATE } from '@/lib/ussd/states';

function validateAtRequest(req: NextRequest): boolean {
  if (process.env.AT_USERNAME === 'sandbox') return true;
  const apiKey = req.headers.get('apiKey');
  return apiKey === process.env.AT_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!validateAtRequest(req)) {
    return new NextResponse(getUssdText('en', 'unauthorized'), {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    const formData    = await req.formData();
    const sessionId   = formData.get('sessionId') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const text        = formData.get('text') as string ?? '';

    const rateCheck = checkRateLimit(phoneNumber);
    if (!rateCheck.allowed) {
      return new NextResponse(`END ${getUssdText('en', 'error_generic')}`, {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 1. Load or create USSD Session
    let session = await prisma.ussdSession.findUnique({ where: { sessionId } });
    if (!session) {
      session = await prisma.ussdSession.create({
        data: { sessionId, phone: phoneNumber, state: USSD_STATE.ROOT, data: {} }
      });
    }

    // 2. Load Farmer context
    const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });

    // 3. Parse input
    // Africa's Talking sends the entire accumulated string.
    // We only care about the *latest* input (the last segment).
    const steps = text.split('*').filter(Boolean);
    const currentInput = steps.length > 0 ? steps[steps.length - 1] : '';

    const ctx = {
      sessionId,
      phone: phoneNumber,
      state: session.state,
      data: session.data as Record<string, unknown> | null,
      farmer,
    };

    const currentStateId = ctx.state;
    const currentScreen = menuTree[currentStateId];

    if (!currentScreen) {
      console.error(`[USSD] State ${currentStateId} not found in menu tree. Resetting.`);
      await prisma.ussdSession.update({ where: { sessionId }, data: { state: USSD_STATE.ROOT, data: {} } });
      return new NextResponse(con(getUssdText(farmer?.language ?? 'en', 'main_menu')), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 4. Render Initial Menu (if text is empty, i.e., first dial)
    if (text === '') {
      // Await here because render can be async
      const responseText = await currentScreen.render(ctx);
      // Check if it's an END response
      if (responseText.startsWith('END')) {
        await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
        return new NextResponse(responseText, { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      return new NextResponse(responseText, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // 5. Process Input
    const { nextState, data } = await currentScreen.onInput(currentInput, ctx);

    // 6. Handle Terminal States (Return to Root)
    if (nextState === USSD_STATE.ROOT && data?.otpSent) {
      // Special case: OTP sent means we should END the session
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      return new NextResponse(end(getUssdText(ctx.farmer?.language ?? 'en', `otp_sent_${ctx.farmer?.language ?? 'en'}`)), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (nextState === USSD_STATE.ROOT && data?.aboutText) {
      // Special case: About menu selections return text and end
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      return new NextResponse(end(data.aboutText as string), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (nextState === USSD_STATE.ROOT && data?.price) {
      // Special case: Price lookup returns text and ends
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      const price = data.price as number;
      return new NextResponse(end(getUssdText(ctx.farmer?.language ?? 'en', `prices_current_${ctx.farmer?.language ?? 'en'}`, { price: price?.toLocaleString() ?? 'N/A' })), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (nextState === USSD_STATE.ROOT && data?.txDetails) {
      // Special case: Tx details return text and end
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      const tx = data.txDetails as { reference: string; buyer: { name: string }; quantityBags: number; totalValue: number; status: string };
      return new NextResponse(end(getUssdText(ctx.farmer?.language ?? 'en', `tx_details_${ctx.farmer?.language ?? 'en'}`, { ref: tx.reference, buyer: tx.buyer.name, bags: tx.quantityBags, total: tx.totalValue.toLocaleString(), status: tx.status })), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (nextState === USSD_STATE.ROOT && data?.sellSuccess) {
      // Special case: Sell success returns text and ends
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      const lang = ctx.farmer?.language ?? 'en';
      const product = ctx.data?.product === '1' ? (lang === 'sw' ? 'Mahindi' : 'Maize') : (lang === 'sw' ? 'Maharage' : 'Beans');
      return new NextResponse(end(getUssdText(lang, `sell_success_${lang}`, { quantity: ctx.data?.qty as number, product, price: ctx.data?.price as number })), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (nextState === USSD_STATE.ROOT && data?.groupsDefer) {
      // Special case: Groups defer returns text and ends
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      return new NextResponse(end(getUssdText(ctx.farmer?.language ?? 'en', `groups_defer_${ctx.farmer?.language ?? 'en'}`)), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (nextState === USSD_STATE.ROOT && data?.moisture) {
      // Special case: QC result returns text and ends
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      const lang = ctx.farmer?.language ?? 'en';
      const moisture = parseInt(data.moisture as string);
      if (isNaN(moisture)) return new NextResponse(end(getUssdText(lang, `qc_invalid_${lang}`)), { status: 200, headers: { 'Content-Type': 'text/plain' } });
      if (moisture <= 13) return new NextResponse(end(getUssdText(lang, `qc_premium_${lang}`)), { status: 200, headers: { 'Content-Type': 'text/plain' } });
      return new NextResponse(end(getUssdText(lang, `qc_standard_${lang}`)), { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // 7. Persist Next State
    const nextScreen = menuTree[nextState];
    if (!nextScreen) {
      console.error(`[USSD] Next state ${nextState} not found in menu tree. Resetting.`);
      await prisma.ussdSession.update({ where: { sessionId }, data: { state: USSD_STATE.ROOT, data: {} } });
      return new NextResponse(con(getUssdText(ctx.farmer?.language ?? 'en', 'main_menu')), {
        status: 200, headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Merge data
    const mergedData = { ...ctx.data, ...data };

    // 8. Render Next Screen
    const nextCtx = { ...ctx, state: nextState, data: mergedData };
    // Await here because render can be async
    const nextResponseText = await nextScreen.render(nextCtx);

    // Save state
    await prisma.ussdSession.update({
      where: { sessionId },
      data: { state: nextState, data: mergedData as object }
    });

    // Check if it's an END response
    if (nextResponseText.startsWith('END')) {
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
    }

    return new NextResponse(nextResponseText, {
      status: 200, headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('[USSD] Handler error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return new NextResponse(getUssdText('en', 'error_service_en'), {
      status: 200, headers: { 'Content-Type': 'text/plain' }
    });
  }
}
