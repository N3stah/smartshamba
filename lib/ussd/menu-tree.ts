import { prisma } from '@/lib/prisma';
import { USSD_STATE } from './states';
import { con, end } from '@/lib/africastalking';
import { getUssdText } from './i18n';
import { sanitizeInput } from '@/lib/sanitize';
import { sanitizeNationalId } from '@/lib/kyc';
import { assignSmartShambaId } from '@/lib/smartshamba-id';
import { sendNotification } from '@/lib/notifications';
import { otpTemplate } from '@/lib/notifications/templates';
import { createOtp } from '@/lib/otp';
import { verifyFarmerPin, verifyBuyerPin } from '@/lib/auth/pin';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import { initiateStkPush } from '@/lib/mpesa-stk';
import { getPlanDetails } from '@/lib/subscriptions/plans';
import { SubscriptionType, SubscriptionBillingPeriod } from '@prisma/client';

interface UssdSessionContext {
  sessionId: string;
  phone: string;
  state: number;
  data: Record<string, any> | null;
  farmer: Awaited<ReturnType<typeof prisma.farmer.findUnique>>;
  buyer: Awaited<ReturnType<typeof prisma.buyer.findFirst>>;
}

export interface MenuScreen {
  render: (ctx: UssdSessionContext) => string | Promise<string>;
  onInput: (
    input: string,
    ctx: UssdSessionContext
  ) => Promise<{ nextState: number; data?: Record<string, unknown> }>;
}

const PILOT_COUNTIES = [
  'Trans Nzoia', 'Uasin Gishu', 'Nakuru', 'Kakamega', 'Bungoma', 'Busia', 'Kericho',
];

export const menuTree: Record<number, MenuScreen> = {
  // ── ROOT MENU ──────────────────────────────────────────────
  [USSD_STATE.ROOT]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? ctx.buyer?.language ?? 'en', 'main_menu')),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: ctx.farmer ? USSD_STATE.FARMER_MAIN : USSD_STATE.FARMER_REG_LANG };
      if (input === '2') return { nextState: ctx.buyer ? USSD_STATE.BUYER_MAIN : USSD_STATE.BUYER_OTP_MENU }; // Fallback if not registered
      if (input === '3') return { nextState: USSD_STATE.ABOUT_MENU };
      if (input === '0') return { nextState: USSD_STATE.ROOT };
      return { nextState: USSD_STATE.ROOT };
    }
  },

  // ── FARMER REGISTRATION ────────────────────────────────────
  [USSD_STATE.FARMER_REG_LANG]: {
    render: (ctx) => con(getUssdText('en', 'reg_step1')),
    onInput: async (input) => {
      const lang = input === '2' ? 'sw' : 'en';
      return { nextState: USSD_STATE.FARMER_REG_NAME, data: { lang } };
    }
  },
  [USSD_STATE.FARMER_REG_NAME]: {
    render: (ctx) => con(getUssdText(ctx.data?.lang ?? 'en', `reg_step2_${ctx.data?.lang ?? 'en'}`)),
    onInput: async (input, ctx) => ({ nextState: USSD_STATE.FARMER_REG_NATIONAL_ID, data: { ...ctx.data, name: input } })
  },
  [USSD_STATE.FARMER_REG_NATIONAL_ID]: {
    render: (ctx) => con(getUssdText(ctx.data?.lang ?? 'en', `reg_step3_${ctx.data?.lang ?? 'en'}`)),
    onInput: async (input, ctx) => ({ nextState: USSD_STATE.FARMER_REG_COUNTY, data: { ...ctx.data, nationalId: input } })
  },
  [USSD_STATE.FARMER_REG_COUNTY]: {
    render: (ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      const countyList = PILOT_COUNTIES.map((c, i) => `${i + 1}. ${c}`).join('\\n');
      return con(getUssdText(lang, `reg_county_${lang}`, { counties: countyList }));
    },
    onInput: async (input, ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      const countyChoice = parseInt(input);
      if (countyChoice === 8) return { nextState: USSD_STATE.FARMER_REG_LOCATION_INPUT };
      if (countyChoice >= 1 && countyChoice <= PILOT_COUNTIES.length) {
        const countyName = PILOT_COUNTIES[countyChoice - 1];
        const county = await prisma.county.findUnique({ where: { name: countyName } });
        if (!county) return { nextState: USSD_STATE.FARMER_REG_COUNTY };
        const wards = await prisma.ward.findMany({ where: { countyId: county.id }, orderBy: { name: 'asc' }, take: 8 });
        const wardList = wards.map((w, i) => `${i + 1}. ${w.name}`).join('\\n');
        return { nextState: USSD_STATE.FARMER_REG_WARD_SELECT, data: { ...ctx.data, countyId: county.id, countyName, wards } };
      }
      return { nextState: USSD_STATE.FARMER_REG_COUNTY };
    }
  },
  [USSD_STATE.FARMER_REG_LOCATION_INPUT]: {
    render: (ctx) => con(getUssdText(ctx.data?.lang ?? 'en', `reg_location_${ctx.data?.lang ?? 'en'}`)),
    onInput: async () => {
      throw new Error('County code is required for SmartShamba ID. Cannot register via free-text location.');
    }
  },
  [USSD_STATE.FARMER_REG_WARD_SELECT]: {
    render: (ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      const wards = ctx.data?.wards ?? [];
      const wardList = wards.map((w: any, i: number) => `${i + 1}. ${w.name}`).join('\\n');
      return con(getUssdText(lang, `reg_ward_${lang}`, { wards: wardList }));
    },
    onInput: async (input, ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      const wardChoice = parseInt(input);
      const wards = ctx.data?.wards ?? [];
      if (wardChoice === 9) return { nextState: USSD_STATE.FARMER_REG_VILLAGE_INPUT };
      const selectedWard = wards[wardChoice - 1];
      if (!selectedWard) return { nextState: USSD_STATE.FARMER_REG_WARD_SELECT };
      const name = sanitizeInput(ctx.data?.name);
      const nationalId = sanitizeNationalId(ctx.data?.nationalId);
      const countyId = ctx.data?.countyId;
      const countyName = ctx.data?.countyName;
      const county = await prisma.county.findUnique({ where: { id: countyId } });
      if (!county?.code) throw new Error('County code missing for SmartShamba ID');
      const countyCode = county.code;
      const { farmer, smartshambaId } = await prisma.$transaction(async (tx) => {
        const farmer = await tx.farmer.create({
          data: { phone: ctx.phone, name, nationalId, location: `${selectedWard.name}, ${countyName}`, countyId, wardId: selectedWard.id, language: lang }
        });
        const sid = await assignSmartShambaId('FARMER', farmer.id, countyCode, tx);
        return { farmer, smartshambaId: sid };
      });
      sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: Registration successful. Your ID is ${smartshambaId}.` }).catch(e => console.error('[USSD] SMS failed:', e));
      return { nextState: USSD_STATE.FARMER_REG_OTP_PROMPT, data: { ...ctx.data, farmerId: farmer.id, smartshambaId } };
    }
  },
  [USSD_STATE.FARMER_REG_VILLAGE_INPUT]: {
    render: (ctx) => con(getUssdText(ctx.data?.lang ?? 'en', `reg_village_${ctx.data?.lang ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      const name = sanitizeInput(ctx.data?.name);
      const nationalId = sanitizeNationalId(ctx.data?.nationalId);
      const countyId = ctx.data?.countyId;
      const countyName = ctx.data?.countyName;
      const wards = ctx.data?.wards ?? [];
      const wardChoice = parseInt(ctx.data?.wardChoice ?? '9');
      const selectedWard = wards[wardChoice - 1];
      const village = sanitizeInput(input);
      const county = await prisma.county.findUnique({ where: { id: countyId } });
      if (!county?.code) throw new Error('County code missing for SmartShamba ID');
      const countyCode = county.code;
      const { farmer, smartshambaId } = await prisma.$transaction(async (tx) => {
        const farmer = await tx.farmer.create({
          data: { phone: ctx.phone, name, nationalId, location: `${selectedWard?.name ?? village}, ${countyName}`, countyId, wardId: selectedWard?.id, village, language: lang }
        });
        const sid = await assignSmartShambaId('FARMER', farmer.id, countyCode, tx);
        return { farmer, smartshambaId: sid };
      });
      sendNotification({ type: 'TRANSACTION_CONFIRMATION', recipientPhone: ctx.phone, body: `SmartShamba: Registration successful. Your ID is ${smartshambaId}.` }).catch(e => console.error('[USSD] SMS failed:', e));
      return { nextState: USSD_STATE.FARMER_REG_OTP_PROMPT, data: { ...ctx.data, farmerId: farmer.id, smartshambaId } };
    }
  },
  [USSD_STATE.FARMER_REG_OTP_PROMPT]: {
    render: (ctx) => con(getUssdText(ctx.data?.lang ?? 'en', `reg_success_${ctx.data?.lang ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') {
        const { code, error } = await createOtp(ctx.phone);
        if (error) return { nextState: USSD_STATE.ROOT };
        const body = otpTemplate({ code: code!, expiresMinutes: 5 });
        sendNotification({ type: 'OTP', recipientPhone: ctx.phone, body }).catch(err => console.error('[USSD] SMS failed:', err));
        return { nextState: USSD_STATE.ROOT, data: { ...ctx.data, otpSent: true } };
      }
      return { nextState: USSD_STATE.ROOT, data: { ...ctx.data, otpSent: false } };
    }
  },

  // ── FARMER MAIN MENU ───────────────────────────────────────
  [USSD_STATE.FARMER_MAIN]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', 'farmer_menu')),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.FARMER_SELL_CROP };
      if (input === '2') return { nextState: USSD_STATE.FARMER_GROUPS_MENU };
      if (input === '3') return { nextState: USSD_STATE.FARMER_MARKET_MENU };
      if (input === '4') return { nextState: USSD_STATE.FARMER_BANK_MENU };
      if (input === '5') return { nextState: USSD_STATE.FARMER_QC_LISTING_SELECT };
      if (input === '6') return { nextState: USSD_STATE.FARMER_OTP_MENU };
      if (input === '0') return { nextState: USSD_STATE.ROOT };
      return { nextState: USSD_STATE.FARMER_MAIN };
    }
  },

  // ── BUYER MAIN MENU ───────────────────────────────────────
  [USSD_STATE.BUYER_MAIN]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', 'buyer_menu')),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.BUYER_POST_DEMAND_PRODUCT };
      if (input === '2') return { nextState: USSD_STATE.BUYER_MARKET_MENU };
      if (input === '3') return { nextState: USSD_STATE.BUYER_BANK_MENU };
      if (input === '4') return { nextState: USSD_STATE.BUYER_VERIFY_MENU };
      if (input === '5') return { nextState: USSD_STATE.BUYER_OTP_MENU };
      if (input === '0') return { nextState: USSD_STATE.ROOT };
      return { nextState: USSD_STATE.BUYER_MAIN };
    }
  },

  // ── BUYER > POST DEMAND ───────────────────────────────────
  [USSD_STATE.BUYER_POST_DEMAND_PRODUCT]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `buyer_post_demand_product_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input !== '1') return { nextState: USSD_STATE.BUYER_MAIN };
      return { nextState: USSD_STATE.BUYER_POST_DEMAND_BAG_SIZE, data: { product: 'Maize' } };
    }
  },
  [USSD_STATE.BUYER_POST_DEMAND_BAG_SIZE]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `buyer_post_demand_bag_size_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input !== '1' && input !== '2') return { nextState: USSD_STATE.BUYER_MAIN };
      const bagSize = input === '1' ? 50 : 90;
      return { nextState: USSD_STATE.BUYER_POST_DEMAND_QTY, data: { ...ctx.data, bagSize } };
    }
  },
  [USSD_STATE.BUYER_POST_DEMAND_QTY]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `buyer_post_demand_qty_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const qty = parseInt(input);
      if (isNaN(qty) || qty <= 0 || qty > 1000) return { nextState: USSD_STATE.BUYER_MAIN };
      return { nextState: USSD_STATE.BUYER_POST_DEMAND_DURATION, data: { ...ctx.data, qty } };
    }
  },
  [USSD_STATE.BUYER_POST_DEMAND_DURATION]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `buyer_post_demand_duration_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      let days = 0;
      if (input === '1') days = 7;
      else if (input === '2') days = 14;
      else if (input === '3') days = 30;
      else return { nextState: USSD_STATE.BUYER_MAIN };
      
      const startDate = new Date();
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      return { nextState: USSD_STATE.BUYER_POST_DEMAND_PRICE, data: { ...ctx.data, startDate, endDate, durationDays: days } };
    }
  },
  [USSD_STATE.BUYER_POST_DEMAND_PRICE]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `buyer_post_demand_price_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const price = parseInt(input);
      if (isNaN(price) || price <= 0) return { nextState: USSD_STATE.BUYER_MAIN };
      return { nextState: USSD_STATE.BUYER_POST_DEMAND_CONFIRM, data: { ...ctx.data, price } };
    }
  },
  [USSD_STATE.BUYER_POST_DEMAND_CONFIRM]: {
    render: (ctx) => {
      const lang = ctx.buyer?.language ?? 'en';
      const durationText = ctx.data?.durationDays === 7 ? '1 Week' : ctx.data?.durationDays === 14 ? '2 Weeks' : '1 Month';
      return con(getUssdText(lang, `buyer_post_demand_confirm_${lang}`, { product: ctx.data?.product, qty: ctx.data?.qty, bagSize: ctx.data?.bagSize, duration: durationText, price: ctx.data?.price }));
    },
    onInput: async (input, ctx) => {
      if (input !== '1') return { nextState: USSD_STATE.BUYER_MAIN };
      await prisma.buyerDemand.create({
        data: {
          buyerId: ctx.buyer!.id,
          product: ctx.data?.product,
          quantityBags: ctx.data?.qty,
          bagSize: `${ctx.data?.bagSize}kg`,
          pricePerBag: ctx.data?.price,
          startDate: ctx.data?.startDate,
          endDate: ctx.data?.endDate,
          location: ctx.buyer?.location ?? 'Nairobi',
          status: 'ACTIVE'
        }
      });
      return { nextState: USSD_STATE.BUYER_MAIN, data: { buyerDemandCreated: true } };
    }
  },

  // ── BUYER > LIVE MARKET ───────────────────────────────────
  [USSD_STATE.BUYER_MARKET_MENU]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `buyer_market_menu_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1' || input === '2') return { nextState: USSD_STATE.BUYER_MARKET_LIST, data: { listType: input } };
      if (input === '0') return { nextState: USSD_STATE.BUYER_MAIN };
      return { nextState: USSD_STATE.BUYER_MARKET_MENU };
    }
  },
  [USSD_STATE.BUYER_MARKET_LIST]: {
    render: async (ctx) => {
      const lang = ctx.buyer?.language ?? 'en';
      if (ctx.data?.listType === '1') {
        const listings = await prisma.produceListing.findMany({ where: { status: 'ACTIVE', product: 'Maize' }, take: 5, orderBy: { createdAt: 'desc' } });
        if (listings.length === 0) return end(getUssdText(lang, `buyer_market_none_${lang}`));
        const list = listings.map((l, i) => `${i + 1}. ${l.quantityBags} bags @ KSh${l.pricePerBag}`).join('\\n');
        return con(getUssdText(lang, `buyer_market_list_${lang}`, { list }));
      } else {
        const groupTx = await prisma.groupTransaction.findMany({ where: { status: 'PENDING' }, take: 5, orderBy: { createdAt: 'desc' } });
        if (groupTx.length === 0) return end(getUssdText(lang, `buyer_market_none_${lang}`));
        const list = groupTx.map((g, i) => `${i + 1}. ${g.totalBags} bags @ KSh${g.pricePerBag}`).join('\\n');
        return con(getUssdText(lang, `buyer_market_list_${lang}`, { list }));
      }
    },
    onInput: async () => ({ nextState: USSD_STATE.BUYER_MAIN })
  },

  // ── BUYER > NOTIFICATION / BANK ───────────────────────────
  [USSD_STATE.BUYER_BANK_MENU]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `bank_menu_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.BUYER_BANK_SMARTSHAMBA_ID };
      if (input === '2') return { nextState: USSD_STATE.BUYER_BANK_SUBSCRIPTIONS };
      if (input === '0') return { nextState: USSD_STATE.BUYER_MAIN };
      return { nextState: USSD_STATE.BUYER_BANK_MENU };
    }
  },
  [USSD_STATE.BUYER_BANK_SMARTSHAMBA_ID]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `bank_smartshamba_id_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input !== ctx.buyer?.smartshambaId) {
        return { nextState: USSD_STATE.BUYER_MAIN, data: { bankIdMismatch: true } };
      }
      return { nextState: USSD_STATE.BUYER_BANK_PIN, data: { ...ctx.data, smartshambaIdVerified: true } };
    }
  },
  [USSD_STATE.BUYER_BANK_PIN]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `bank_pin_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const result = await verifyBuyerPin(ctx.buyer!.id, input);
      if (!result.success) {
        return { nextState: USSD_STATE.BUYER_MAIN, data: { bankPinError: result.error } };
      }
      const balance = await getWalletBalance(ctx.buyer!.id, 'BUYER');
      return { nextState: USSD_STATE.BUYER_BANK_BALANCE_RESULT, data: { ...ctx.data, balance } };
    }
  },
  [USSD_STATE.BUYER_BANK_BALANCE_RESULT]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `bank_balance_${ctx.buyer?.language ?? 'en'}`, { balance: ctx.data?.balance?.toLocaleString() ?? '0' })),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.BUYER_BANK_WITHDRAW_AMOUNT };
      return { nextState: USSD_STATE.BUYER_MAIN };
    }
  },
  [USSD_STATE.BUYER_BANK_WITHDRAW_AMOUNT]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `bank_withdraw_amount_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const amount = parseFloat(input);
      if (isNaN(amount) || amount <= 0) return { nextState: USSD_STATE.BUYER_MAIN };
      const balance = ctx.data?.balance as number;
      if (amount > balance) return { nextState: USSD_STATE.BUYER_MAIN, data: { bankWithdrawInsufficient: true } };
      return { nextState: USSD_STATE.BUYER_BANK_WITHDRAW_PIN, data: { ...ctx.data, withdrawAmount: amount } };
    }
  },
  [USSD_STATE.BUYER_BANK_WITHDRAW_PIN]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `bank_withdraw_pin_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const result = await verifyBuyerPin(ctx.buyer!.id, input);
      if (!result.success) return { nextState: USSD_STATE.BUYER_MAIN, data: { bankPinError: result.error } };
      
      try {
        await prisma.$transaction(async (tx) => {
          const wallet = await tx.wallet.findFirst({ where: { buyerId: ctx.buyer!.id } });
          if (!wallet) throw new Error('Wallet not found');
          if (wallet.balance < ctx.data?.withdrawAmount) throw new Error('Insufficient balance');
          
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: ctx.data?.withdrawAmount }, lockedBalance: { increment: ctx.data?.withdrawAmount } }
          });
          
          await tx.withdrawalRequest.create({
            data: { walletId: wallet.id, amount: ctx.data?.withdrawAmount, mpesaPhone: ctx.phone }
          });
        });
        return { nextState: USSD_STATE.BUYER_MAIN, data: { bankWithdrawSuccess: true, withdrawAmount: ctx.data?.withdrawAmount } };
      } catch (error) {
        console.error('[WITHDRAW] Failed:', (error as Error).message);
        return { nextState: USSD_STATE.BUYER_MAIN, data: { bankWithdrawInsufficient: true } };
      }
    }
  },
  [USSD_STATE.BUYER_BANK_SUBSCRIPTIONS]: {
    render: async (ctx) => {
      const lang = ctx.buyer?.language ?? 'en';
      const subs = await prisma.subscription.findMany({
        where: { buyerId: ctx.buyer!.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (subs.length === 0) return end(getUssdText(lang, `bank_subscriptions_none_${lang}`));
      const list = subs.map((s, i) => `${i + 1}. ${s.type.replace(/_/g, ' ')} - ${s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'N/A'}`).join('\\n');
      return con(getUssdText(lang, `bank_subscriptions_${lang}`, { list }));
    },
    onInput: async (input, ctx) => {
      const subs = await prisma.subscription.findMany({
        where: { buyerId: ctx.buyer!.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      const selected = subs[parseInt(input) - 1];
      if (!selected) return { nextState: USSD_STATE.BUYER_MAIN };
      return { nextState: USSD_STATE.BUYER_BANK_SUB_CANCEL, data: { subId: selected.id, subType: selected.type } };
    }
  },
  [USSD_STATE.BUYER_BANK_SUB_CANCEL]: {
    render: (ctx) => {
      const lang = ctx.buyer?.language ?? 'en';
      return con(getUssdText(lang, `bank_sub_cancel_${lang}`, { type: String(ctx.data?.subType).replace(/_/g, ' ') }));
    },
    onInput: async (input, ctx) => {
      if (input !== '1') return { nextState: USSD_STATE.BUYER_MAIN };
      await prisma.subscription.updateMany({
        where: { id: ctx.data?.subId, buyerId: ctx.buyer!.id },
        data: { status: 'CANCELLED' }
      });
      return { nextState: USSD_STATE.BUYER_MAIN, data: { bankSubCancelled: true } };
    }
  },

  // ── BUYER > VERIFICATION ──────────────────────────────────
  [USSD_STATE.BUYER_VERIFY_MENU]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `buyer_verify_menu_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      let billingPeriod: SubscriptionBillingPeriod | null = null;
      if (input === '1') billingPeriod = 'MONTHLY';
      else if (input === '2') billingPeriod = 'YEARLY';
      else return { nextState: USSD_STATE.BUYER_MAIN };
      
      const plan = getPlanDetails('BUYER_VERIFICATION', billingPeriod);
      if (!plan) return { nextState: USSD_STATE.BUYER_MAIN };
      return { nextState: USSD_STATE.BUYER_VERIFY_CONFIRM, data: { billingPeriod, price: plan.priceKsh } };
    }
  },
  [USSD_STATE.BUYER_VERIFY_CONFIRM]: {
    render: (ctx) => {
      const lang = ctx.buyer?.language ?? 'en';
      const planName = ctx.data?.billingPeriod === 'MONTHLY' ? 'Monthly' : 'Yearly';
      return con(getUssdText(lang, `buyer_verify_confirm_${lang}`, { price: ctx.data?.price, plan: planName }));
    },
    onInput: async (input, ctx) => {
      if (input !== '1') return { nextState: USSD_STATE.BUYER_MAIN };
      try {
        const sub = await prisma.subscription.create({
          data: { type: 'BUYER_VERIFICATION', billingPeriod: ctx.data?.billingPeriod, status: 'PENDING_PAYMENT', priceKsh: ctx.data?.price, buyerId: ctx.buyer!.id }
        });
        const stkResult = await initiateStkPush(ctx.buyer!.phone!, ctx.data?.price, sub.id, `Buyer Verification`);
        if (stkResult.success && stkResult.checkoutRequestId) {
          await prisma.subscription.update({ where: { id: sub.id }, data: { checkoutRequestId: stkResult.checkoutRequestId } });
          return { nextState: USSD_STATE.BUYER_MAIN, data: { alertsPaidInitiated: true } };
        } else {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELLED' } });
          return { nextState: USSD_STATE.BUYER_MAIN, data: { alertsPaidFailed: true } };
        }
      } catch (error) {
        console.error('[STK] Buyer Verification failed:', (error as Error).message);
        return { nextState: USSD_STATE.BUYER_MAIN, data: { alertsPaidFailed: true } };
      }
    }
  },

  // ── BUYER > WEB LOGIN ─────────────────────────────────────
  [USSD_STATE.BUYER_OTP_MENU]: {
    render: (ctx) => con(getUssdText(ctx.buyer?.language ?? 'en', `otp_menu_${ctx.buyer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') {
        const { code, error } = await createOtp(ctx.phone);
        if (error) return { nextState: USSD_STATE.BUYER_MAIN };
        const body = otpTemplate({ code: code!, expiresMinutes: 5 });
        sendNotification({ type: 'OTP', recipientPhone: ctx.phone, body }).catch(err => console.error('[USSD] SMS failed:', err));
        return { nextState: USSD_STATE.BUYER_MAIN, data: { otpSent: true } };
      }
      return { nextState: USSD_STATE.BUYER_MAIN };
    }
  },

  // ── FARMER > SELL PRODUCE ──────────────────────────────────
  [USSD_STATE.FARMER_SELL_CROP]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `sell_step1_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input !== '1' && input !== '2') return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_SELL_QTY, data: { product: input } };
    }
  },
  [USSD_STATE.FARMER_SELL_QTY]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `sell_step2_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const qty = parseInt(input);
      if (isNaN(qty) || qty <= 0 || qty > 500) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_SELL_KG_PER_BAG, data: { ...ctx.data, qty } };
    }
  },
  [USSD_STATE.FARMER_SELL_KG_PER_BAG]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `sell_kg_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const kg = parseInt(input);
      if (kg !== 50 && kg !== 90) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_SELL_PRICE, data: { ...ctx.data, kgPerBag: kg } };
    }
  },
  [USSD_STATE.FARMER_SELL_PRICE]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `sell_step3_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const price = parseInt(input);
      if (isNaN(price) || price <= 0) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_SELL_CONFIRM, data: { ...ctx.data, price } };
    }
  },
  [USSD_STATE.FARMER_SELL_CONFIRM]: {
    render: (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const product = ctx.data?.product === '1' ? (lang === 'sw' ? 'Mahindi' : 'Maize') : (lang === 'sw' ? 'Maharage' : 'Beans');
      return con(getUssdText(lang, `sell_confirm_${lang}`, { product, quantity: ctx.data?.qty, kg: ctx.data?.kgPerBag, price: ctx.data?.price }));
    },
    onInput: async (input, ctx) => {
      if (input === '2') return { nextState: USSD_STATE.FARMER_MAIN };
      const product = ctx.data?.product === '1' ? 'Maize' : 'Beans';
      const qty = parseInt(ctx.data?.qty);
      const price = parseInt(ctx.data?.price);
      const kg = parseInt(ctx.data?.kgPerBag);
      await prisma.produceListing.create({ data: { farmerId: ctx.farmer!.id, product, quantityBags: qty, pricePerBag: price, bagSizeKg: kg, status: 'ACTIVE' } });
      return { nextState: USSD_STATE.FARMER_MAIN, data: { ...ctx.data, sellSuccess: true } };
    }
  },

  // ── FARMER > GROUPS ────────────────────────────────────────
  [USSD_STATE.FARMER_GROUPS_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `groups_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.FARMER_GROUPS_JOIN_LIST };
      if (input === '2') return { nextState: USSD_STATE.FARMER_GROUPS_CREATE_NAME };
      if (input === '3') return { nextState: USSD_STATE.FARMER_GROUPS_ACTIVE_LIST };
      if (input === '0') return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_GROUPS_MENU };
    }
  },
  [USSD_STATE.FARMER_GROUPS_JOIN_LIST]: {
    render: async (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const groups = await prisma.farmerGroup.findMany({
        where: { verified: true, active: true, countyId: ctx.farmer?.countyId ?? undefined },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      if (groups.length === 0) return end(getUssdText(lang, `groups_join_none_${lang}`));
      const list = groups.map((g, i) => `${i + 1}. ${g.name}`).join('\\n');
      return con(getUssdText(lang, `groups_join_list_${lang}`, { list }));
    },
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const groups = await prisma.farmerGroup.findMany({
        where: { verified: true, active: true, countyId: ctx.farmer?.countyId ?? undefined },
        take: 5,
      });
      const selected = groups[parseInt(input) - 1];
      if (!selected) return { nextState: USSD_STATE.FARMER_MAIN };
      const existing = await prisma.groupMember.findUnique({ where: { groupId_farmerId: { groupId: selected.id, farmerId: ctx.farmer!.id } } });
      if (existing) return { nextState: USSD_STATE.FARMER_MAIN, data: { groupsJoinAlready: true, groupName: selected.name } };
      await prisma.groupMember.create({ data: { groupId: selected.id, farmerId: ctx.farmer!.id } });
      const waLink = selected.whatsappApproved ? selected.whatsappLink : undefined;
      return { nextState: USSD_STATE.FARMER_MAIN, data: { groupsJoinSuccess: true, groupName: selected.name, waLink } };
    }
  },
  [USSD_STATE.FARMER_GROUPS_CREATE_NAME]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `groups_create_name_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => ({ nextState: USSD_STATE.FARMER_GROUPS_CREATE_COUNTY, data: { ...ctx.data, groupName: input } })
  },
  [USSD_STATE.FARMER_GROUPS_CREATE_COUNTY]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `groups_create_county_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const groupLocation = sanitizeInput(input);
      return { nextState: USSD_STATE.FARMER_GROUPS_CREATE_CONFIRM, data: { ...ctx.data, groupLocation } };
    }
  },
  [USSD_STATE.FARMER_GROUPS_CREATE_CONFIRM]: {
    render: (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      return con(getUssdText(lang, `groups_create_confirm_${lang}`, { name: ctx.data?.groupName, location: ctx.data?.groupLocation }));
    },
    onInput: async (input, ctx) => {
      if (input !== '1') return { nextState: USSD_STATE.FARMER_MAIN };
      const group = await prisma.farmerGroup.create({
        data: { name: ctx.data?.groupName, village: ctx.data?.groupLocation, createdById: ctx.farmer!.id, countyId: ctx.farmer?.countyId, verified: false }
      });
      return { nextState: USSD_STATE.FARMER_MAIN, data: { groupsCreateSuccess: true } };
    }
  },
  [USSD_STATE.FARMER_GROUPS_ACTIVE_LIST]: {
    render: async (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const membership = await prisma.groupMember.findFirst({
        where: { farmerId: ctx.farmer!.id },
        include: { group: true },
      });
      if (!membership) return end(getUssdText(lang, `groups_active_none_${lang}`));
      return con(getUssdText(lang, `groups_active_list_${lang}`, { name: membership.group.name, status: membership.group.verified ? 'Verified' : 'Pending' }));
    },
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.FARMER_SELL_CROP };
      return { nextState: USSD_STATE.FARMER_MAIN };
    }
  },

  // ── FARMER > MARKET PRICE & ALERTS ─────────────────────────
  [USSD_STATE.FARMER_MARKET_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `market_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.FARMER_MARKET_PRICES };
      if (input === '2') return { nextState: USSD_STATE.FARMER_ALERTS_MENU };
      if (input === '0') return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_MARKET_MENU };
    }
  },
  [USSD_STATE.FARMER_MARKET_PRICES]: {
    render: async (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const demands = await prisma.buyerDemand.findMany({
        where: { status: 'ACTIVE', product: 'Maize' },
        include: { buyer: { select: { name: true, pricePerBag: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
      if (demands.length === 0) return end(getUssdText(lang, `market_prices_none_${lang}`));
      const list = demands.map((d, i) => `${i + 1}. ${d.buyer.name}: ${d.quantityBags} bags @ KSh ${d.buyer.pricePerBag}`).join('\\n');
      return con(getUssdText(lang, `market_prices_${lang}`, { list }));
    },
    onInput: async () => ({ nextState: USSD_STATE.FARMER_MAIN })
  },
  [USSD_STATE.FARMER_ALERTS_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `alerts_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.FARMER_ALERTS_FREE_MENU };
      if (input === '2') return { nextState: USSD_STATE.FARMER_ALERTS_PAID_MENU };
      if (input === '0') return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_ALERTS_MENU };
    }
  },
  [USSD_STATE.FARMER_ALERTS_FREE_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `alerts_free_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      let prefField = '';
      let alertName = '';
      if (input === '1') { prefField = 'buyerDemandAlerts'; alertName = 'Buyer Demand & Prices'; }
      else if (input === '2') { prefField = 'weatherAlerts'; alertName = 'Weather Prediction'; }
      else if (input === '3') { prefField = 'harvestTips'; alertName = 'News'; }
      else return { nextState: USSD_STATE.FARMER_MAIN };
      await prisma.notificationPreference.upsert({
        where: { farmerId: ctx.farmer!.id },
        create: { farmerId: ctx.farmer!.id, [prefField]: true },
        update: { [prefField]: true },
      });
      return { nextState: USSD_STATE.FARMER_MAIN, data: { alertsFreeSubscribed: true, alertName } };
    }
  },
  [USSD_STATE.FARMER_ALERTS_PAID_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `alerts_paid_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      let subType: SubscriptionType | null = null;
      let planName = '';
      if (input === '1') { subType = 'WEATHER_ALERTS'; planName = 'Weather Alerts'; }
      else if (input === '2') { subType = 'BUYER_DEMAND_ALERTS'; planName = 'Buyer Demand Instant'; }
      else if (input === '3') { subType = 'PEST_ALERTS'; planName = 'Pest Alerts'; }
      else return { nextState: USSD_STATE.FARMER_MAIN };
      const plan = getPlanDetails(subType, 'MONTHLY');
      if (!plan) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_ALERTS_PAID_CONFIRM, data: { subType, planName, price: plan.priceKsh } };
    }
  },
  [USSD_STATE.FARMER_ALERTS_PAID_CONFIRM]: {
    render: (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      return con(getUssdText(lang, `alerts_paid_prompt_${lang}`, { price: ctx.data?.price, plan: ctx.data?.planName }));
    },
    onInput: async (input, ctx) => {
      if (input !== '1') return { nextState: USSD_STATE.FARMER_MAIN };
      try {
        const sub = await prisma.subscription.create({
          data: { type: ctx.data?.subType, billingPeriod: 'MONTHLY', status: 'PENDING_PAYMENT', priceKsh: ctx.data?.price, farmerId: ctx.farmer!.id }
        });
        const stkResult = await initiateStkPush(ctx.farmer!.phone, ctx.data?.price, sub.id, `Subscription ${ctx.data?.planName}`);
        if (stkResult.success && stkResult.checkoutRequestId) {
          await prisma.subscription.update({ where: { id: sub.id }, data: { checkoutRequestId: stkResult.checkoutRequestId } });
          return { nextState: USSD_STATE.FARMER_MAIN, data: { alertsPaidInitiated: true } };
        } else {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELLED' } });
          return { nextState: USSD_STATE.FARMER_MAIN, data: { alertsPaidFailed: true } };
        }
      } catch (error) {
        console.error('[STK] USSD initiation failed:', (error as Error).message);
        return { nextState: USSD_STATE.FARMER_MAIN, data: { alertsPaidFailed: true } };
      }
    }
  },
  
  // ── FARMER > NOTIFICATION / BANK ────────────────────────────
  [USSD_STATE.FARMER_BANK_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `bank_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.FARMER_BANK_SMARTSHAMBA_ID };
      if (input === '2') return { nextState: USSD_STATE.FARMER_BANK_SUBSCRIPTIONS };
      if (input === '0') return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_BANK_MENU };
    }
  },
  [USSD_STATE.FARMER_BANK_SMARTSHAMBA_ID]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `bank_smartshamba_id_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input !== ctx.farmer?.smartshambaId) {
        return { nextState: USSD_STATE.FARMER_MAIN, data: { bankIdMismatch: true } };
      }
      return { nextState: USSD_STATE.FARMER_BANK_PIN, data: { ...ctx.data, smartshambaIdVerified: true } };
    }
  },
  [USSD_STATE.FARMER_BANK_PIN]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `bank_pin_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const result = await verifyFarmerPin(ctx.farmer!.id, input);
      if (!result.success) {
        return { nextState: USSD_STATE.FARMER_MAIN, data: { bankPinError: result.error } };
      }
      const balance = await getWalletBalance(ctx.farmer!.id, 'FARMER');
      return { nextState: USSD_STATE.FARMER_BANK_BALANCE_RESULT, data: { ...ctx.data, balance } };
    }
  },
  [USSD_STATE.FARMER_BANK_BALANCE_RESULT]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `bank_balance_${ctx.farmer?.language ?? 'en'}`, { balance: ctx.data?.balance?.toLocaleString() ?? '0' })),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: USSD_STATE.FARMER_BANK_WITHDRAW_AMOUNT };
      return { nextState: USSD_STATE.FARMER_MAIN };
    }
  },
  [USSD_STATE.FARMER_BANK_WITHDRAW_AMOUNT]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `bank_withdraw_amount_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const amount = parseFloat(input);
      if (isNaN(amount) || amount <= 0) return { nextState: USSD_STATE.FARMER_MAIN };
      const balance = ctx.data?.balance as number;
      if (amount > balance) return { nextState: USSD_STATE.FARMER_MAIN, data: { bankWithdrawInsufficient: true } };
      return { nextState: USSD_STATE.FARMER_BANK_WITHDRAW_PIN, data: { ...ctx.data, withdrawAmount: amount } };
    }
  },
  [USSD_STATE.FARMER_BANK_WITHDRAW_PIN]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `bank_withdraw_pin_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const result = await verifyFarmerPin(ctx.farmer!.id, input);
      if (!result.success) return { nextState: USSD_STATE.FARMER_MAIN, data: { bankPinError: result.error } };
      
      try {
        await prisma.$transaction(async (tx) => {
          const wallet = await tx.wallet.findFirst({ where: { farmerId: ctx.farmer!.id } });
          if (!wallet) throw new Error('Wallet not found');
          if (wallet.balance < ctx.data?.withdrawAmount) throw new Error('Insufficient balance');
          
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: ctx.data?.withdrawAmount }, lockedBalance: { increment: ctx.data?.withdrawAmount } }
          });
          
          await tx.withdrawalRequest.create({
            data: { walletId: wallet.id, amount: ctx.data?.withdrawAmount, mpesaPhone: ctx.phone }
          });
        });
        return { nextState: USSD_STATE.FARMER_MAIN, data: { bankWithdrawSuccess: true, withdrawAmount: ctx.data?.withdrawAmount } };
      } catch (error) {
        console.error('[WITHDRAW] Failed:', (error as Error).message);
        return { nextState: USSD_STATE.FARMER_MAIN, data: { bankWithdrawInsufficient: true } };
      }
    }
  },
  [USSD_STATE.FARMER_BANK_SUBSCRIPTIONS]: {
    render: async (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const subs = await prisma.subscription.findMany({
        where: { farmerId: ctx.farmer!.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (subs.length === 0) return end(getUssdText(lang, `bank_subscriptions_none_${lang}`));
      const list = subs.map((s, i) => `${i + 1}. ${s.type.replace(/_/g, ' ')} - ${s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'N/A'}`).join('\\n');
      return con(getUssdText(lang, `bank_subscriptions_${lang}`, { list }));
    },
    onInput: async (input, ctx) => {
      const subs = await prisma.subscription.findMany({
        where: { farmerId: ctx.farmer!.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      const selected = subs[parseInt(input) - 1];
      if (!selected) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_BANK_SUB_CANCEL, data: { subId: selected.id, subType: selected.type } };
    }
  },
  [USSD_STATE.FARMER_BANK_SUB_CANCEL]: {
    render: (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      return con(getUssdText(lang, `bank_sub_cancel_${lang}`, { type: String(ctx.data?.subType).replace(/_/g, ' ') }));
    },
    onInput: async (input, ctx) => {
      if (input !== '1') return { nextState: USSD_STATE.FARMER_MAIN };
      await prisma.subscription.updateMany({
        where: { id: ctx.data?.subId, farmerId: ctx.farmer!.id },
        data: { status: 'CANCELLED' }
      });
      return { nextState: USSD_STATE.FARMER_MAIN, data: { bankSubCancelled: true } };
    }
  },

  // ── FARMER > QUALITY CHECK ─────────────────────────────────
  [USSD_STATE.FARMER_QC_LISTING_SELECT]: {
    render: async (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const listings = await prisma.produceListing.findMany({
        where: { farmerId: ctx.farmer!.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (listings.length === 0) return end(getUssdText(lang, `qc_listing_none_${lang}`));
      const list = listings.map((l, i) => `${i + 1}. ${l.product} - ${l.quantityBags} bags`).join('\\n');
      return con(getUssdText(lang, `qc_listing_${lang}`, { list }));
    },
    onInput: async (input, ctx) => {
      const listings = await prisma.produceListing.findMany({
        where: { farmerId: ctx.farmer!.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      const selected = listings[parseInt(input) - 1];
      if (!selected) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_QC_MOISTURE, data: { listingId: selected.id } };
    }
  },
  [USSD_STATE.FARMER_QC_MOISTURE]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `qc_moisture_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => ({ nextState: USSD_STATE.FARMER_QC_COLOUR, data: { ...ctx.data, moisture: input } })
  },
  [USSD_STATE.FARMER_QC_COLOUR]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `qc_colour_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => ({ nextState: USSD_STATE.FARMER_QC_BROKEN, data: { ...ctx.data, colour: input } })
  },
  [USSD_STATE.FARMER_QC_BROKEN]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `qc_broken_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => ({ nextState: USSD_STATE.FARMER_QC_FOREIGN, data: { ...ctx.data, broken: input } })
  },
  [USSD_STATE.FARMER_QC_FOREIGN]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `qc_foreign_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      await prisma.qualityAssessment.create({
        data: {
          produceListingId: ctx.data?.listingId,
          moistureAnswer: ctx.data?.moisture,
          grainColour: ctx.data?.colour,
          brokenGrain: ctx.data?.broken,
          foreignMatter: input,
        }
      });
      return { nextState: USSD_STATE.FARMER_MAIN, data: { qcSuccess: true } };
    }
  },

  // ── FARMER > WEBSITE LOGIN ─────────────────────────────────
  [USSD_STATE.FARMER_OTP_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `otp_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      if (input === '1') {
        const { code, error } = await createOtp(ctx.phone);
        if (error) return { nextState: USSD_STATE.FARMER_MAIN };
        const body = otpTemplate({ code: code!, expiresMinutes: 5 });
        sendNotification({ type: 'OTP', recipientPhone: ctx.phone, body }).catch(err => console.error('[USSD] SMS failed:', err));
        return { nextState: USSD_STATE.FARMER_MAIN, data: { otpSent: true } };
      }
      return { nextState: USSD_STATE.FARMER_MAIN };
    }
  },

  // ── ABOUT SECTION ──────────────────────────────────────────
  [USSD_STATE.ABOUT_MENU]: {
    render: () => con(`About SmartShamba\n\n1. How it Works\n2. Bag Sizes (90kg & 50kg)\n3. Contact Support\n4. Website\n0. Back`),
    onInput: async (input) => {
      if (input === '1') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'How it Works:\n1. Register via USSD\n2. View buyer offers\n3. Confirm sale\n4. Get paid via M-Pesa' } };
      if (input === '2') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'Bag Sizes:\nStandard bag is 90kg.\nSmall bag is 50kg.' } };
      if (input === '3') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'Contact Support:\nCall: 0712345678\nEmail: help@smartshamba.com' } };
      if (input === '4') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'Visit our website:\nsmartshamba.vercel.app' } };
      return { nextState: USSD_STATE.ROOT };
    }
  }
};
