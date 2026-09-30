import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { con, end } from '@/lib/africastalking';
import { checkRateLimit } from '@/lib/rateLimit';
import { getUssdText } from '@/lib/ussd/i18n';
import { menuTree } from '@/lib/ussd/menu-tree';
import { USSD_STATE } from '@/lib/ussd/states';
import { sendNotification } from '@/lib/notifications';

function validateAtRequest(req: NextRequest): boolean {
  if (process.env.AT_USERNAME === 'sandbox') return true;
  const apiKey = req.headers.get('apiKey');
  return apiKey === process.env.AT_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!validateAtRequest(req)) {
    return new NextResponse(getUssdText('en', 'unauthorized'), { status: 401, headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const text = formData.get('text') as string ?? '';

    const rateCheck = checkRateLimit(phoneNumber);
    if (!rateCheck.allowed) {
      return new NextResponse(`END ${getUssdText('en', 'error_generic')}`, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    let session = await prisma.ussdSession.findUnique({ where: { sessionId } });
    if (!session) {
      session = await prisma.ussdSession.create({ data: { sessionId, phone: phoneNumber, state: USSD_STATE.ROOT, data: {} } });
    }

    const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
    const buyer = await prisma.buyer.findFirst({ where: { phone: phoneNumber } });
    const provider = await prisma.transportProvider.findUnique({ where: { phone: phoneNumber } });

    const steps = text.split('*').filter(Boolean);
    const currentInput = steps.length > 0 ? steps[steps.length - 1] : '';

    const ctx = {
      sessionId,
      phone: phoneNumber,
      state: session.state,
      data: session.data as Record<string, unknown> | null,
      farmer,
      buyer,
      provider,
    };

    const currentScreen = menuTree[ctx.state];
    if (!currentScreen) {
      console.error(`[USSD] State ${ctx.state} not found. Resetting.`);
      await prisma.ussdSession.update({ where: { sessionId }, data: { state: USSD_STATE.ROOT, data: {} } });
      return new NextResponse(con(getUssdText(farmer?.language ?? buyer?.language ?? provider?.language ?? 'en', 'main_menu')), { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    if (text === '') {
      const responseText = await currentScreen.render(ctx);
      if (responseText.startsWith('END')) {
        await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
      }
      return new NextResponse(responseText, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    const { nextState, data } = await currentScreen.onInput(currentInput, ctx);
    const lang = ctx.farmer?.language ?? ctx.buyer?.language ?? ctx.provider?.language ?? 'en';

    // Handle terminal states
    if (nextState === USSD_STATE.ROOT || nextState === USSD_STATE.FARMER_MAIN || nextState === USSD_STATE.BUYER_MAIN || nextState === USSD_STATE.TRANSPORT_MAIN) {
      const terminalData = data || {};
      let endResponse = '';

      if (terminalData.otpSent) {
        endResponse = end(getUssdText(lang, `otp_sent_${lang}`));
      } else if (terminalData.aboutText) {
        endResponse = end(terminalData.aboutText as string);
      } else if (terminalData.transportRegSuccess) {
        endResponse = end(getUssdText(lang, `transport_reg_success_${lang}`, { id: terminalData.smartshambaId as string }));
      } else if (terminalData.transportRegFailed) {
        endResponse = end(getUssdText(lang, `error_generic_${lang}`));
      } else if (terminalData.sellSuccess) {
        const product = ctx.data?.product === '1' ? (lang === 'sw' ? 'Mahindi' : 'Maize') : (lang === 'sw' ? 'Maharage' : 'Beans');
        endResponse = end(getUssdText(lang, `sell_success_${lang}`, { quantity: ctx.data?.qty as number, product, price: ctx.data?.price as number }));
        sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: Produce posted! ${ctx.data?.qty} bags of ${product} at KSh ${ctx.data?.price}.` }).catch(e => console.error('[USSD] SMS failed:', e));
      } else if (terminalData.buyerDemandCreated) {
        endResponse = end(getUssdText(lang, `buyer_demand_success_${lang}`));
        sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: Demand posted! ${ctx.data?.qty} bags of Maize at KSh ${ctx.data?.price}.` }).catch(e => console.error('[USSD] SMS failed:', e));
      } else if (terminalData.groupsJoinSuccess) {
        const waLink = terminalData.waLink as string | undefined;
        if (waLink) {
          endResponse = end(getUssdText(lang, `groups_join_success_${lang}`, { name: terminalData.groupName as string, link: waLink }));
          sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: You joined ${terminalData.groupName}. WhatsApp: ${waLink}` }).catch(e => console.error('[USSD] SMS failed:', e));
        } else {
          endResponse = end(getUssdText(lang, `groups_join_success_no_wa_${lang}`, { name: terminalData.groupName as string }));
          sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: You joined ${terminalData.groupName}.` }).catch(e => console.error('[USSD] SMS failed:', e));
        }
      } else if (terminalData.groupsJoinAlready) {
        endResponse = end(getUssdText(lang, `groups_join_already_${lang}`));
      } else if (terminalData.groupsCreateSuccess) {
        endResponse = end(getUssdText(lang, `groups_create_success_${lang}`));
        sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: Group created! Pending admin approval.` }).catch(e => console.error('[USSD] SMS failed:', e));
      } else if (terminalData.alertsFreeSubscribed) {
        endResponse = end(getUssdText(lang, `alerts_free_subscribed_${lang}`, { alert: terminalData.alertName as string }));
      } else if (terminalData.alertsPaidInitiated) {
        endResponse = end(getUssdText(lang, `alerts_paid_initiated_${lang}`));
      } else if (terminalData.alertsPaidFailed) {
        endResponse = end(getUssdText(lang, `alerts_paid_failed_${lang}`));
      } else if (terminalData.bankIdMismatch) {
        endResponse = end(getUssdText(lang, `bank_id_mismatch_${lang}`));
      } else if (terminalData.bankPinError) {
        endResponse = end(getUssdText(lang, `bank_pin_error_${lang}`, { error: terminalData.bankPinError as string }));
      } else if (terminalData.bankWithdrawSuccess) {
        endResponse = end(getUssdText(lang, `bank_withdraw_success_${lang}`, { amount: terminalData.withdrawAmount as number }));
        sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: Withdrawal request submitted for KSh ${terminalData.withdrawAmount}.` }).catch(e => console.error('[USSD] SMS failed:', e));
      } else if (terminalData.bankWithdrawInsufficient) {
        endResponse = end(getUssdText(lang, `bank_withdraw_insufficient_${lang}`));
      } else if (terminalData.bankSubCancelled) {
        endResponse = end(getUssdText(lang, `bank_sub_cancelled_${lang}`));
      } else if (terminalData.qcSuccess) {
        endResponse = end(getUssdText(lang, `qc_success_${lang}`));
        sendNotification({ type: 'QUALITY_ADVISORY', recipientPhone: ctx.phone, body: `SmartShamba: Quality check submitted successfully.` }).catch(e => console.error('[USSD] SMS failed:', e));
      } else if (terminalData.loadsNone) {
        endResponse = end(getUssdText(lang, `transport_loads_none_${lang}`));
      } else if (terminalData.loadAcceptSuccess) {
        endResponse = end(getUssdText(lang, `transport_loads_success_${lang}`, { pickup: terminalData.pickup as string, dropoff: terminalData.dropoff as string }));
      } else if (terminalData.loadAcceptFailed) {
        endResponse = end(getUssdText(lang, `error_generic_${lang}`));
      }

      if (endResponse) {
        await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
        return new NextResponse(endResponse, { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
    }

    // Persist and render next screen
    const nextScreen = menuTree[nextState];
    if (!nextScreen) {
      console.error(`[USSD] Next state ${nextState} not found. Resetting.`);
      await prisma.ussdSession.update({ where: { sessionId }, data: { state: USSD_STATE.ROOT, data: {} } });
      return new NextResponse(con(getUssdText(lang, 'main_menu')), { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    const mergedData = { ...ctx.data, ...data };
    const nextCtx = { ...ctx, state: nextState, data: mergedData };
    const nextResponseText = await nextScreen.render(nextCtx);

    await prisma.ussdSession.update({ where: { sessionId }, data: { state: nextState, data: mergedData as object } });

    if (nextResponseText.startsWith('END')) {
      await prisma.ussdSession.delete({ where: { sessionId } }).catch(() => {});
    }

    return new NextResponse(nextResponseText, { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error('[USSD] Handler error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return new NextResponse(getUssdText('en', 'error_service_en'), { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
}
