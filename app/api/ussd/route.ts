import * as Sentry from '@sentry/nextjs';
import { sendNotification } from '@/lib/notifications';
import { otpTemplate } from '@/lib/notifications/templates';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { con, end, parseText } from '@/lib/africastalking';
import { checkRateLimit } from '@/lib/rateLimit';
import { isValidKenyanNationalId, sanitizeNationalId } from '@/lib/kyc';
import { createOtp } from '@/lib/otp';
import { getUssdText } from '@/lib/ussd/i18n';
import { sanitizeInput } from '@/lib/sanitize';

const PILOT_COUNTIES = [
  'Trans Nzoia',
  'Uasin Gishu',
  'Nakuru',
  'Kakamega',
  'Bungoma',
  'Busia',
  'Kericho',
];

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
    const phoneNumber = formData.get('phoneNumber') as string;
    const text        = formData.get('text') as string ?? '';

    const rateCheck = checkRateLimit(phoneNumber);
    if (!rateCheck.allowed) {
      return new NextResponse(
        `END ${getUssdText('en', 'error_generic')}`,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const steps = parseText(text);
    const step  = steps.length;

    const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
    const buyer = await prisma.buyer.findFirst({ where: { phone: phoneNumber } });
    
    let response: string = '';
    const lang = farmer?.language ?? 'en'; // Default to English if not registered or not set

    // ── STEP 0: MAIN MENU ───────────────────────────────────────────────────
    if (step === 0) {
      response = con(getUssdText(lang, 'main_menu'));
    } 

    // ── FARMER SECTION ──────────────────────────────────────────────────────
    else if (steps[0] === '1') {
      
      // UNREGISTERED FARMER
      if (!farmer) {
        // Step 1: Select Language
        if (step === 1) {
          response = con(getUssdText('en', 'reg_step1')); // Always show language selection in English/Swahili bilingual format
        } 
        // Step 2: Enter Name (based on language choice)
        else if (step === 2) {
          const selectedLang = steps[1] === '2' ? 'sw' : 'en';
          response = con(getUssdText(selectedLang, `reg_step2_${selectedLang}`));
        } 
        // Step 3: Enter National ID
        else if (step === 3) {
          const selectedLang = steps[1] === '2' ? 'sw' : 'en';
          response = con(getUssdText(selectedLang, `reg_step3_${selectedLang}`));
        } 
        // Step 4: Validate ID & Select County
        else if (step === 4) {
          const selectedLang = steps[1] === '2' ? 'sw' : 'en';
          if (!isValidKenyanNationalId(steps[3])) {
            response = end(getUssdText(selectedLang, `reg_invalid_id_${selectedLang}`));
          } else {
            const countyList = PILOT_COUNTIES.map((c, i) => `${i + 1}. ${c}`).join('\n');
            response = con(getUssdText(selectedLang, `reg_county_${selectedLang}`, { counties: countyList }));
          }
        } 
        // Step 5: Ward Selection / Other County Input
        else if (step === 5) {
          const selectedLang = steps[1] === '2' ? 'sw' : 'en';
          const countyChoice = parseInt(steps[4]);
          if (countyChoice === 8) {
            response = con(getUssdText(selectedLang, `reg_location_${selectedLang}`));
          } else if (countyChoice >= 1 && countyChoice <= PILOT_COUNTIES.length) {
            const countyName = PILOT_COUNTIES[countyChoice - 1];
            const county = await prisma.county.findUnique({ where: { name: countyName } });
            if (!county) {
              response = end(getUssdText(selectedLang, `error_db_${selectedLang}`));
            } else {
              const wards = await prisma.ward.findMany({
                where: { countyId: county.id },
                orderBy: { name: 'asc' },
                take: 8,
              });
              const wardList = wards.map((w, i) => `${i + 1}. ${w.name}`).join('\n');
              response = con(getUssdText(selectedLang, `reg_ward_${selectedLang}`, { wards: wardList }));
            }
          } else {
            response = end(getUssdText(selectedLang, `error_generic_${selectedLang}`));
          }
        } 
        // Step 6: Village Input / Save Other County
        else if (step === 6) {
          const selectedLang = steps[1] === '2' ? 'sw' : 'en';
          const countyChoice = parseInt(steps[4]);
          if (countyChoice === 8) {
            const name = steps[2];
            const nationalId = sanitizeNationalId(steps[3])!;
            const location = steps[5];
            await prisma.farmer.create({ data: { phone: phoneNumber, name: sanitizeInput(name), location: sanitizeInput(location), nationalId, language: selectedLang } });
            response = con(getUssdText(selectedLang, `reg_success_${selectedLang}`));
          } else {
            const wardChoice = parseInt(steps[5]);
            if (wardChoice === 9) {
              response = con(getUssdText(selectedLang, `reg_village_${selectedLang}`));
            } else {
              const countyName = PILOT_COUNTIES[countyChoice - 1];
              const county = await prisma.county.findUnique({ where: { name: countyName } });
              if (!county) {
                response = end(getUssdText(selectedLang, `error_db_${selectedLang}`));
              } else {
                const wards = await prisma.ward.findMany({
                  where: { countyId: county.id },
                  orderBy: { name: 'asc' },
                  take: 8,
                });
                const selectedWard = wards[wardChoice - 1];
                if (!selectedWard) {
                  response = end(getUssdText(selectedLang, `error_generic_${selectedLang}`));
                } else {
                  response = con(getUssdText(selectedLang, `reg_village_${selectedLang}`) + `\nWard: ${selectedWard.name}`);
                }
              }
            }
          }
        } 
        // Step 7: Final Save (Specific Ward & Village)
        else if (step === 7) {
          const selectedLang = steps[1] === '2' ? 'sw' : 'en';
          const countyChoice = parseInt(steps[4]);
          const name = steps[2];
          const nationalId = sanitizeNationalId(steps[3])!;
          
          if (countyChoice === 8) {
            response = end(getUssdText(selectedLang, `error_session_${selectedLang}`));
          } else {
            const wardChoice = parseInt(steps[5]);
            const countyName = PILOT_COUNTIES[countyChoice - 1];
            const county = await prisma.county.findUnique({ where: { name: countyName } });

            if (!county) {
              response = end(getUssdText(selectedLang, `error_db_${selectedLang}`));
            } else if (wardChoice === 9) {
              const village = steps[6];
              await prisma.farmer.create({
                data: { phone: phoneNumber, name: sanitizeInput(name), location: sanitizeInput(village), countyId: county.id, village: sanitizeInput(village), nationalId, language: selectedLang },
              });
              response = con(getUssdText(selectedLang, `reg_success_${selectedLang}`));
            } else {
              const wards = await prisma.ward.findMany({
                where: { countyId: county.id },
                orderBy: { name: 'asc' },
                take: 8,
              });
              const selectedWard = wards[wardChoice - 1];
              if (!selectedWard) {
                response = end(getUssdText(selectedLang, `error_session_${selectedLang}`));
              } else {
                const village = steps[6];
                await prisma.farmer.create({
                  data: {
                    phone: phoneNumber,
                    name: sanitizeInput(name),
                    nationalId,
                    location: sanitizeInput(`${selectedWard.name}, ${countyName}`),
                    countyId: county.id,
                    wardId: selectedWard.id,
                    village: sanitizeInput(village),
                    language: selectedLang,
                  },
                });
                response = con(getUssdText(selectedLang, `reg_success_${selectedLang}`));
              }
            }
          }
        } 
        // Step 8: OTP Prompt after Registration
        else if (step === 8) {
          const selectedLang = steps[1] === '2' ? 'sw' : 'en';
          if (steps[7] === '1') {
            const { code, error } = await createOtp(phoneNumber);
            if (error) {
              response = end(error);
            } else {
              const body = otpTemplate({ code: code!, expiresMinutes: 5 });
              await sendNotification({
                type: 'OTP',
                recipientPhone: phoneNumber,
                body,
              }).catch((err) => console.error('[USSD] SMS failed:', err));
              response = end(getUssdText(selectedLang, `otp_sent_${selectedLang}`));
            }
          } else {
            response = end(getUssdText(selectedLang, `reg_other_county_success_${selectedLang}`, { name: steps[2] }));
          }
        }
      } 
      
      // REGISTERED FARMER MENU
      else {
        if (step === 1) {
          response = con(getUssdText(lang, 'farmer_menu'));
        } 
        
        // 1. SELL PRODUCE
        else if (steps[1] === '1') {
          if (step === 2) {
            response = con(getUssdText(lang, `sell_step1_${lang}`));
          } 
          else if (step === 3) {
            if (steps[2] !== '1' && steps[2] !== '2') {
              response = end(getUssdText(lang, `sell_invalid_product_${lang}`));
            } else {
              response = con(getUssdText(lang, `sell_step2_${lang}`));
            }
          } 
          else if (step === 4) {
            const quantity = parseInt(steps[3]);
            if (isNaN(quantity) || quantity <= 0 || quantity > 500) {
              response = end(getUssdText(lang, `sell_invalid_qty_${lang}`));
            } else {
              response = con(getUssdText(lang, `sell_step3_${lang}`));
            }
          } 
          else if (step === 5) {
            const product = steps[2] === '1' ? (lang === 'sw' ? 'Mahindi' : 'Maize') : (lang === 'sw' ? 'Maharage' : 'Beans');
            const quantity = parseInt(steps[3]);
            const price = parseInt(steps[4]);
            
            if (isNaN(price) || price <= 0) {
              response = end(getUssdText(lang, `sell_invalid_price_${lang}`));
            } else {
              response = con(getUssdText(lang, `sell_confirm_${lang}`, { product, quantity, price }));
            }
          } 
          else if (step === 6) {
            if (steps[5] === '2') {
              response = end(getUssdText(lang, `sell_cancel_${lang}`));
            } else if (steps[5] === '1') {
              const product = steps[2] === '1' ? 'Maize' : 'Beans'; // Save to DB in English
              const quantity = parseInt(steps[3]);
              const price = parseInt(steps[4]);
              
              await prisma.produceListing.create({
                data: {
                  farmerId: farmer.id,
                  product,
                  quantityBags: quantity,
                  pricePerBag: price,
                  status: 'ACTIVE',
                },
              });
              
              const displayProduct = steps[2] === '1' ? (lang === 'sw' ? 'Mahindi' : 'Maize') : (lang === 'sw' ? 'Maharage' : 'Beans');
              response = end(getUssdText(lang, `sell_success_${lang}`, { quantity, product: displayProduct, price }));
            } else {
              response = end(getUssdText(lang, `error_generic_${lang}`));
            }
          }
        } 
        
        // 2. MY GROUPS
        else if (steps[1] === '2') {
          if (step === 2) response = con(getUssdText(lang, `groups_menu_${lang}`));
          else response = end(getUssdText(lang, `groups_defer_${lang}`));
        } 
        
        // 3. MARKET PRICES & ALERTS
        else if (steps[1] === '3') {
          if (step === 2) response = con(getUssdText(lang, `prices_menu_${lang}`));
          else if (step === 3) {
            if (steps[2] === '1') {
              const topBuyer = await prisma.buyer.findFirst({ orderBy: { pricePerBag: 'desc' } });
              response = end(getUssdText(lang, `prices_current_${lang}`, { price: topBuyer?.pricePerBag?.toLocaleString() ?? 'N/A' }));
            } else if (steps[2] === '2') {
              response = end(getUssdText(lang, `prices_subscribe_${lang}`));
            }
          }
        } 
        
        // 4. MY TRANSACTIONS
        else if (steps[1] === '4') {
          if (step === 2) {
            const transactions = await prisma.transaction.findMany({
              where: { farmer: { phone: phoneNumber } },
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: { buyer: true },
            });
            if (transactions.length === 0) {
              response = end(getUssdText(lang, `tx_none_${lang}`));
            } else {
              const list = transactions.map((t, i) => `${i + 1}. ${t.buyer.name}\n   ${t.status} - KSh ${t.totalValue.toLocaleString()}`).join('\n');
              response = con(getUssdText(lang, `tx_list_${lang}`, { list }));
            }
          } 
          else if (step === 3) {
            const transactions = await prisma.transaction.findMany({
              where: { farmer: { phone: phoneNumber } },
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: { buyer: true },
            });
            const txIndex = parseInt(steps[2]) - 1;
            const selectedTx = transactions[txIndex];
            if (!selectedTx) {
              response = end(getUssdText(lang, `tx_invalid_${lang}`));
            } else {
              response = end(getUssdText(lang, `tx_details_${lang}`, { ref: selectedTx.reference, buyer: selectedTx.buyer.name, bags: selectedTx.quantityBags, total: selectedTx.totalValue.toLocaleString(), status: selectedTx.status }));
            }
          }
        } 
        
        // 5. QUALITY CHECK
        else if (steps[1] === '5') {
          if (step === 2) response = con(getUssdText(lang, `qc_step1_${lang}`));
          else if (step === 3) {
            const moisture = parseInt(steps[2]);
            if (isNaN(moisture)) {
              response = end(getUssdText(lang, `qc_invalid_${lang}`));
            } else if (moisture <= 13) {
              response = end(getUssdText(lang, `qc_premium_${lang}`));
            } else {
              response = end(getUssdText(lang, `qc_standard_${lang}`));
            }
          }
        } 
        
        // 6. WEBSITE LOGIN
        else if (steps[1] === '6') {
          if (step === 2) response = con(getUssdText(lang, `otp_menu_${lang}`));
          else if (step === 3) {
            if (steps[2] === '1') {
              const { code, error } = await createOtp(phoneNumber);
              if (error) {
                response = end(error);
              } else {
                const body = otpTemplate({ code: code!, expiresMinutes: 5 });
                await sendNotification({
                  type: 'OTP',
                  recipientPhone: phoneNumber,
                  body,
                }).catch((err) => console.error('[USSD] SMS failed:', err));
                response = end(getUssdText(lang, `otp_sent_${lang}`));
              }
            }
          }
        }
      }
    } 

    // ── BUYER SECTION ───────────────────────────────────────────────────────
    else if (steps[0] === '2') {
      // Deferring buyer mutations to web dashboard to prevent schema conflicts
      response = end('Please visit smartshamba.vercel.app/buyer to manage your buyer account and offers.');
    } 

    // ── ABOUT / HELP SECTION ────────────────────────────────────────────────
    else if (steps[0] === '3') {
      if (step === 1) {
        response = con(`About SmartShamba\n\n1. How it Works\n2. Bag Sizes (90kg & 50kg)\n3. Contact Support\n4. Website\n0. Back`);
      } 
      else if (steps[1] === '1') {
        response = end('How it Works:\n1. Register via USSD\n2. View buyer offers\n3. Confirm sale\n4. Get paid via M-Pesa');
      } 
      else if (steps[1] === '2') {
        response = end('Bag Sizes:\nStandard bag is 90kg.\nSmall bag is 50kg.');
      } 
      else if (steps[1] === '3') {
        response = end('Contact Support:\nCall: 0712345678\nEmail: help@smartshamba.com');
      } 
      else if (steps[1] === '4') {
        response = end('Visit our website:\nsmartshamba.vercel.app');
      }
    } 

    // ── EXIT ────────────────────────────────────────────────────────────────
    else if (steps[0] === '0') {
      response = end(getUssdText(lang, 'exit'));
    }

    return new NextResponse(response, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('[USSD] Handler error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return new NextResponse(getUssdText('en', 'error_service_en'), {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
