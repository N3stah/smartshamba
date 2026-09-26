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

interface UssdSessionContext {
  sessionId: string;
  phone: string;
  state: number;
  data: Record<string, any> | null;
  farmer: Awaited<ReturnType<typeof prisma.farmer.findUnique>>;
}

export interface MenuScreen {
  render: (ctx: UssdSessionContext) => string | Promise<string>;
  onInput: (
    input: string,
    ctx: UssdSessionContext
  ) => Promise<{ nextState: number; data?: Record<string, unknown> }>;
}

const PILOT_COUNTIES = [
  'Trans Nzoia',
  'Uasin Gishu',
  'Nakuru',
  'Kakamega',
  'Bungoma',
  'Busia',
  'Kericho',
];

export const menuTree: Record<number, MenuScreen> = {
  // ── ROOT MENU ──────────────────────────────────────────────
  [USSD_STATE.ROOT]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', 'main_menu')),
    onInput: async (input, ctx) => {
      if (input === '1') return { nextState: ctx.farmer ? USSD_STATE.FARMER_MAIN : USSD_STATE.FARMER_REG_LANG };
      if (input === '2') return { nextState: USSD_STATE.BUYER_MAIN };
      if (input === '3') return { nextState: USSD_STATE.ABOUT_MENU };
      if (input === '0') return { nextState: USSD_STATE.ROOT }; // Handled by dispatcher as END
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
      return con(getUssdText(lang, `reg_county_${lang}`, { counties: countyList}));
    },
    onInput: async (input, ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      const countyChoice = parseInt(input);
      if (countyChoice === 8) return { nextState: USSD_STATE.FARMER_REG_LOCATION_INPUT };
      if (countyChoice >= 1 && countyChoice <= PILOT_COUNTIES.length) {
        const countyName = PILOT_COUNTIES[countyChoice - 1];
        const county = await prisma.county.findUnique({ where: { name: countyName } });
        if (!county) return { nextState: USSD_STATE.FARMER_REG_COUNTY };
        const wards = await prisma.ward.findMany({ where: { countyId: county.id}, orderBy: { name: 'asc' }, take: 8 });
        const wardList = wards.map((w, i) => `${i + 1}. ${w.name}`).join('\\n');
        return { nextState: USSD_STATE.FARMER_REG_WARD_SELECT, data: { ...ctx.data, countyId: county.id, countyName, wards } };
      }
      return { nextState: USSD_STATE.FARMER_REG_COUNTY };
    }
  },
  [USSD_STATE.FARMER_REG_LOCATION_INPUT]: {
    render: (ctx) => con(getUssdText(ctx.data?.lang ?? 'en', `reg_location_${ctx.data?.lang ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      const name = sanitizeInput(ctx.data?.name);
      const nationalId = sanitizeNationalId(ctx.data?.nationalId);
      const location = sanitizeInput(input);
      
      // Reject registration if county is not mapped
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
          data: {
            phone: ctx.phone,
            name,
            nationalId,
            location: `${selectedWard.name}, ${countyName}`,
            countyId,
            wardId: selectedWard.id,
            language: lang,
          }
        });
        const sid = await assignSmartShambaId('FARMER', farmer.id, countyCode, tx);
        return { farmer, smartshambaId: sid };
      });
      
      // Send SMS with ID
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: ctx.phone,
        body: `SmartShamba: Registration successful. Your ID is ${smartshambaId}.`
      }).catch(e => console.error('[USSD] SMS failed:', e));

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
          data: {
            phone: ctx.phone,
            name,
            nationalId,
            location: `${selectedWard?.name ?? village}, ${countyName}`,
            countyId,
            wardId: selectedWard?.id,
            village,
            language: lang,
          }
        });
        const sid = await assignSmartShambaId('FARMER', farmer.id, countyCode, tx);
        return { farmer, smartshambaId: sid };
      });

      // Send SMS with ID
      await sendNotification({
        type: 'TRANSACTION_CONFIRMATION',
        recipientPhone: ctx.phone,
        body: `SmartShamba: Registration successful. Your ID is ${smartshambaId}.`
      }).catch(e => console.error('[USSD] SMS failed:', e));

      return { nextState: USSD_STATE.FARMER_REG_OTP_PROMPT, data: { ...ctx.data, farmerId: farmer.id, smartshambaId } };
    }
  },
  [USSD_STATE.FARMER_REG_OTP_PROMPT]: {
    render: (ctx) => con(getUssdText(ctx.data?.lang ?? 'en', `reg_success_${ctx.data?.lang ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const lang = ctx.data?.lang ?? 'en';
      if (input === '1') {
        const { code, error } = await createOtp(ctx.phone);
        if (error) return { nextState: USSD_STATE.ROOT }; // End session on error
        const body = otpTemplate({ code: code!, expiresMinutes: 5 });
        await sendNotification({ type: 'OTP', recipientPhone: ctx.phone, body }).catch(err => console.error('[USSD] SMS failed:', err));
        return { nextState: USSD_STATE.ROOT, data: { ...ctx.data, otpSent: true} }; // End session
      }
      return { nextState: USSD_STATE.ROOT, data: { ...ctx.data, otpSent: false } };
    }
  },

  // ── FARMER MAIN MENU ───────────────────────────────────────
  [USSD_STATE.FARMER_MAIN]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', 'farmer_menu')),
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      if (input === '1') return { nextState: USSD_STATE.FARMER_SELL_PRODUCT };
      if (input === '2') return { nextState: USSD_STATE.FARMER_GROUPS_MENU };
      if (input === '3') return { nextState: USSD_STATE.FARMER_PRICES_MENU };
      if (input === '4') return { nextState: USSD_STATE.FARMER_TX_LIST };
      if (input === '5') return { nextState: USSD_STATE.FARMER_QC_MOISTURE };
      if (input === '6') return { nextState: USSD_STATE.FARMER_OTP_MENU };
      if (input === '0') return { nextState: USSD_STATE.ROOT };
      return { nextState: USSD_STATE.FARMER_MAIN };
    }
  },

  // ── FARMER > SELL PRODUCE ──────────────────────────────────
  [USSD_STATE.FARMER_SELL_PRODUCT]: {
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
      return { nextState: USSD_STATE.FARMER_SELL_PRICE, data: { ...ctx.data, qty } };
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
      return con(getUssdText(lang, `sell_confirm_${lang}`, { product, quantity:ctx.data?.qty, price: ctx.data?.price }));
    },
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      if (input === '2') return { nextState: USSD_STATE.FARMER_MAIN };
      
      const product = ctx.data?.product === '1' ? 'Maize' : 'Beans';
      const qty = parseInt(ctx.data?.qty);
      const price = parseInt(ctx.data?.price);
      
      await prisma.produceListing.create({
        data: { farmerId: ctx.farmer!.id, product, quantityBags: qty, pricePerBag: price, status: 'ACTIVE' }
      });
      
      return { nextState: USSD_STATE.FARMER_MAIN, data: { ...ctx.data, sellSuccess: true } };
    }
  },

  // ── FARMER > GROUPS ────────────────────────────────────────
  [USSD_STATE.FARMER_GROUPS_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `groups_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async () => ({ nextState: USSD_STATE.FARMER_MAIN, data: { groupsDefer: true } })
  },

  // ── FARMER > PRICES ────────────────────────────────────────
  [USSD_STATE.FARMER_PRICES_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `prices_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      if (input === '1') {
        const topBuyer = await prisma.buyer.findFirst({ orderBy: { pricePerBag:'desc' } });
        return { nextState: USSD_STATE.FARMER_MAIN, data: { price: topBuyer?.pricePerBag } };
      }
      if (input === '2') return { nextState: USSD_STATE.FARMER_MAIN, data: { subscribeAlerts: true } };
      return { nextState: USSD_STATE.FARMER_MAIN };
    }
  },

  // ── FARMER > TRANSACTIONS ──────────────────────────────────
  [USSD_STATE.FARMER_TX_LIST]: {
    render: async (ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const transactions = await prisma.transaction.findMany({
        where: { farmer: { phone: ctx.phone } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { buyer: true },
      });
      if (transactions.length === 0) return end(getUssdText(lang, `tx_none_${lang}`));
      const list = transactions.map((t, i) => `${i + 1}. ${t.buyer.name}\n   ${t.status} - KSh ${t.totalValue.toLocaleString()}`).join('\n');
      return con(getUssdText(lang, `tx_list_${lang}`, { list }));
    },
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const transactions = await prisma.transaction.findMany({
        where: { farmer: { phone: ctx.phone } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { buyer: true },
      });
      const txIndex = parseInt(input) - 1;
      const selectedTx = transactions[txIndex];
      if (!selectedTx) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_MAIN, data: { txDetails: selectedTx} };
    }
  },

  // ── FARMER > QUALITY CHECK ─────────────────────────────────
  [USSD_STATE.FARMER_QC_MOISTURE]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `qc_step1_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      const moisture = parseInt(input);
      if (isNaN(moisture)) return { nextState: USSD_STATE.FARMER_MAIN };
      return { nextState: USSD_STATE.FARMER_MAIN, data: { moisture } };
    }
  },

  // ── FARMER > WEBSITE LOGIN ─────────────────────────────────
  [USSD_STATE.FARMER_OTP_MENU]: {
    render: (ctx) => con(getUssdText(ctx.farmer?.language ?? 'en', `otp_menu_${ctx.farmer?.language ?? 'en'}`)),
    onInput: async (input, ctx) => {
      const lang = ctx.farmer?.language ?? 'en';
      if (input === '1') {
        const { code, error } = await createOtp(ctx.phone);
        if (error) return { nextState: USSD_STATE.FARMER_MAIN };
        const body = otpTemplate({ code: code!, expiresMinutes: 5 });
        await sendNotification({ type: 'OTP', recipientPhone: ctx.phone, body }).catch(err => console.error('[USSD] SMS failed:', err));
        return { nextState: USSD_STATE.FARMER_MAIN, data: { otpSent: true } };
      }
      return { nextState: USSD_STATE.FARMER_MAIN };
    }
  },

  // ── BUYER SECTION ───────────────────────────────────────────
  [USSD_STATE.BUYER_MAIN]: {
    render: () => end('Please visit smartshamba.vercel.app/buyer to manage yourbuyer account and offers.'),
    onInput: async () => ({ nextState: USSD_STATE.ROOT })
  },

  // ── ABOUT SECTION ──────────────────────────────────────────
  [USSD_STATE.ABOUT_MENU]: {
    render: () => con(`About SmartShamba\n\n1. How it Works\n2. Bag Sizes (90kg& 50kg)\n3. Contact Support\n4. Website\n0. Back`),
    onInput: async (input) => {
      if (input === '1') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'How it Works:\n1. Register via USSD\n2. View buyer offers\n3. Confirm sale\n4. Get paid via M-Pesa' } };
      if (input === '2') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'Bag Sizes:\nStandard bag is 90kg.\nSmall bag is 50kg.' } };
      if (input === '3') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'Contact Support:\nCall: 0712345678\nEmail: help@smartshamba.com' } };
      if (input === '4') return { nextState: USSD_STATE.ROOT, data: { aboutText: 'Visit our website:\nsmartshamba.vercel.app' } };
      return { nextState: USSD_STATE.ROOT };
    }
  }
};
