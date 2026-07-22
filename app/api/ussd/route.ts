import * as Sentry from '@sentry/nextjs';
import { sendNotification } from '@/lib/notifications';
import { transactionConfirmationTemplate, otpTemplate } from '@/lib/notifications/templates';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { con, end, parseText } from '@/lib/africastalking';
import { checkRateLimit } from '@/lib/rateLimit';
import { isValidKenyanNationalId, sanitizeNationalId } from '@/lib/kyc';
import { createOtp } from '@/lib/otp';

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

function generateReference(): string {
  return `SS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  if (!validateAtRequest(req)) {
    return new NextResponse('END Unauthorized request.', {
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
        `END You have sent too many requests. Please wait ${rateCheck.retryAfter} seconds and try again.`,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const steps = parseText(text);
    const step  = steps.length;

    const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
    const buyer = await prisma.buyer.findUnique({ where: { phone: phoneNumber } });
    
    let response: string = '';

    // ── STEP 0: MAIN MENU ───────────────────────────────────────────────────
    if (step === 0) {
      response = con('Welcome to SmartShamba\nRift Valley & Western Kenya\n\n1. Farmer\n2. Buyer\n3. About / Help\n0. Exit');
    } 

    // ── FARMER SECTION ──────────────────────────────────────────────────────
    else if (steps[0] === '1') {
      
      // UNREGISTERED FARMER
      if (!farmer) {
        if (step === 1) {
          response = con('New Farmer Registration\nEnter your full name:');
        } 
        else if (step === 2) {
          // steps[0] = '1', steps[1] = Name
          response = con('Enter your National ID\n(8 digits):');
        } 
        else if (step === 3) {
          // steps[2] = ID
          if (!isValidKenyanNationalId(steps[2])) {
            response = end('Invalid ID. Must be 8 digits.\nPlease dial *384*53374# to try again.');
          } else {
            const countyList = PILOT_COUNTIES.map((c, i) => `${i + 1}. ${c}`).join('\n');
            response = con(`Select your county:\n${countyList}\n8. Other county`);
          }
        } 
        else if (step === 4) {
          // steps[3] = County Choice
          const countyChoice = parseInt(steps[3]);
          if (countyChoice === 8) {
            response = con('Enter your location\n(county, town or village):');
          } else if (countyChoice >= 1 && countyChoice <= PILOT_COUNTIES.length) {
            const countyName = PILOT_COUNTIES[countyChoice - 1];
            const county = await prisma.county.findUnique({ where: { name: countyName } });
            if (!county) {
              response = end('Service error. Please dial *384*53374# to try again.');
            } else {
              const wards = await prisma.ward.findMany({
                where: { countyId: county.id },
                orderBy: { name: 'asc' },
                take: 8,
              });
              const wardList = wards.map((w, i) => `${i + 1}. ${w.name}`).join('\n');
              response = con(`Select your ward:\n${wardList}\n9. Other ward`);
            }
          } else {
            response = end('Sorry, that option is not available.\nPlease dial *384*53374# to try again.');
          }
        } 
        else if (step === 5) {
          // steps[4] = Ward Choice
          const countyChoice = parseInt(steps[3]);
          if (countyChoice === 8) {
            // Save with "Other County"
            const name = steps[1];
            const nationalId = sanitizeNationalId(steps[2])!;
            const location = steps[4];
            await prisma.farmer.create({ data: { phone: phoneNumber, name, location, nationalId } });
            response = con(`Registration successful!\nWe will send an OTP to login on the website.\n\n1. Send OTP\n2. Skip`);
          } else {
            const wardChoice = parseInt(steps[4]);
            if (wardChoice === 9) {
              response = con('Enter your village or\nnearest town name:');
            } else {
              const countyName = PILOT_COUNTIES[countyChoice - 1];
              const county = await prisma.county.findUnique({ where: { name: countyName } });
              if (!county) {
                response = end('Service error. Please dial *384*53374# to try again.');
              } else {
                const wards = await prisma.ward.findMany({
                  where: { countyId: county.id },
                  orderBy: { name: 'asc' },
                  take: 8,
                });
                const selectedWard = wards[wardChoice - 1];
                if (!selectedWard) {
                  response = end('Invalid ward selection. Please dial *384*53374# to try again.');
                } else {
                  response = con(`Ward: ${selectedWard.name}\n\nEnter your village name:`);
                }
              }
            }
          }
        } 
        else if (step === 6) {
          // steps[5] = Village
          const countyChoice = parseInt(steps[3]);
          const name = steps[1];
          const nationalId = sanitizeNationalId(steps[2])!;
          
          if (countyChoice === 8) {
            response = end('Invalid session. Please dial *384*53374# to try again.');
          } else {
            const wardChoice = parseInt(steps[4]);
            const countyName = PILOT_COUNTIES[countyChoice - 1];
            const county = await prisma.county.findUnique({ where: { name: countyName } });

            if (!county) {
              response = end('Service error. Please dial *384*53374# to try again.');
            } else if (wardChoice === 9) {
              const village = steps[5];
              await prisma.farmer.create({
                data: { phone: phoneNumber, name, location: village, countyId: county.id, village, nationalId },
              });
              response = con(`Registration successful!\nWe will send an OTP to login on the website.\n\n1. Send OTP\n2. Skip`);
            } else {
              const wards = await prisma.ward.findMany({
                where: { countyId: county.id },
                orderBy: { name: 'asc' },
                take: 8,
              });
              const selectedWard = wards[wardChoice - 1];
              if (!selectedWard) {
                response = end('Invalid session. Please dial *384*53374# to try again.');
              } else {
                const village = steps[5];
                await prisma.farmer.create({
                  data: {
                    phone: phoneNumber,
                    name,
                    nationalId,
                    location: `${selectedWard.name}, ${countyName}`,
                    countyId: county.id,
                    wardId: selectedWard.id,
                    village,
                  },
                });
                response = con(`Registration successful!\nWe will send an OTP to login on the website.\n\n1. Send OTP\n2. Skip`);
              }
            }
          }
        } 
        else if (step === 7) {
          // steps[6] = OTP Choice
          if (steps[6] === '1') {
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
              response = end('OTP sent! Use it to login on smartshamba.vercel.app');
            }
          } else {
            response = end('Thank you for registering. Dial *384*53374# to start selling.');
          }
        }
      } 
      
      // REGISTERED FARMER MENU
      else {
        if (step === 1) {
          response = con(`Farmer Menu\n\n1. Sell Maize / Beans\n2. My Groups\n3. Market Prices & Alerts\n4. My Transactions\n5. Quality Check\n6. Website Login\n0. Back`);
        } 
        else if (steps[1] === '1') {
          // SELL PRODUCE
          if (step === 2) {
            response = con('Select Bag Type:\n1. 90kg (Standard)\n2. 50kg (Small)\n0. Back');
          } 
          else if (step === 3) {
            response = con('Enter number of bags (max 500):');
          } 
          else if (step === 4) {
            const buyers = await prisma.buyer.findMany({
              where: { active: true },
              orderBy: { pricePerBag: 'desc' },
              take: 5,
            });
            const list = buyers.map((b, i) => `${i + 1}. ${b.name}\n   KSh ${b.pricePerBag}/bag`).join('\n');
            response = con(`Buyer offers:\n${list}\n\nReply with buyer number:`);
          } 
          else if (step === 5) {
            const buyers = await prisma.buyer.findMany({
              where: { active: true },
              orderBy: { pricePerBag: 'desc' },
              take: 5,
            });
            const buyerIndex = parseInt(steps[3]) - 1;
            const selectedBuyer = buyers[buyerIndex];
            const quantity = parseInt(steps[2]);
            if (!selectedBuyer || isNaN(quantity) || quantity <= 0 || quantity > 500) {
              response = end('Invalid input. Please dial *384*53374# to try again.');
            } else {
              const total = selectedBuyer.pricePerBag * quantity;
              response = con(`Confirm offer:\nBuyer: ${selectedBuyer.name}\nBags: ${quantity}\nTotal: KSh ${total.toLocaleString()}\n\n1. Confirm\n2. Cancel`);
            }
          } 
          else if (step === 6) {
            if (steps[4] === '1') {
              const buyers = await prisma.buyer.findMany({
                where: { active: true },
                orderBy: { pricePerBag: 'desc' },
                take: 5,
              });
              const buyerIndex = parseInt(steps[3]) - 1;
              const selectedBuyer = buyers[buyerIndex];
              const quantity = parseInt(steps[2]);
              const reference = generateReference();
              const totalValue = selectedBuyer.pricePerBag * quantity;
              
              await prisma.transaction.create({
                data: {
                  reference,
                  farmerId: farmer.id,
                  buyerId: selectedBuyer.id,
                  quantityBags: quantity,
                  pricePerBag: selectedBuyer.pricePerBag,
                  totalValue,
                  status: 'PENDING',
                },
              });

              try {
                const smsBody = transactionConfirmationTemplate({
                  reference,
                  buyerName: selectedBuyer.name,
                  quantityBags: quantity,
                  pricePerBag: selectedBuyer.pricePerBag,
                  totalValue,
                });
                await sendNotification({
                  type: 'TRANSACTION_CONFIRMATION',
                  recipientPhone: phoneNumber,
                  body: smsBody,
                  farmerId: farmer.id,
                });
              } catch (err) {
                console.error('[USSD] SMS failed:', err);
              }
              response = end(`Offer confirmed!\nRef: ${reference}\nTotal: KSh ${totalValue.toLocaleString()}\nSMS sent.`);
            } else {
              response = end('Offer cancelled.');
            }
          }
        } 
        else if (steps[1] === '2') {
          if (step === 2) response = con('My Groups\n1. Join Village Group\n2. Create New Group\n3. My Active Groups\n0. Back');
          else response = end('Please visit smartshamba.vercel.app/dashboard/groups to manage your groups easily.');
        } 
        else if (steps[1] === '3') {
          if (step === 2) response = con('Market Prices & Alerts\n1. Current Prices\n2. Subscribe to Alerts\n0. Back');
          else if (step === 3) {
            if (steps[2] === '1') {
              const topBuyer = await prisma.buyer.findFirst({ orderBy: { pricePerBag: 'desc' } });
              response = end(`Current Top Maize Price:\nKSh ${topBuyer?.pricePerBag ?? 'N/A'} per 90kg bag`);
            } else if (steps[2] === '2') {
              response = end('You are subscribed to weekly market reports. Manage preferences on the website.');
            }
          }
        } 
        else if (steps[1] === '4') {
          if (step === 2) {
            const transactions = await prisma.transaction.findMany({
              where: { farmer: { phone: phoneNumber } },
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: { buyer: true },
            });
            if (transactions.length === 0) {
              response = end('You have no transactions yet.');
            } else {
              const list = transactions.map((t, i) => `${i + 1}. ${t.buyer.name}\n   ${t.status} - KSh ${t.totalValue.toLocaleString()}`).join('\n');
              response = con(`My transactions:\n${list}\n\nReply with number for details:`);
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
              response = end('Invalid selection.');
            } else {
              response = end(`Ref: ${selectedTx.reference}\nBuyer: ${selectedTx.buyer.name}\nBags: ${selectedTx.quantityBags}\nTotal: KSh ${selectedTx.totalValue.toLocaleString()}\nStatus:${selectedTx.status}`);
            }
          }
        } 
        else if (steps[1] === '5') {
          if (step === 2) response = con('Quality Check\nEnter moisture level (e.g. 13):');
          else if (step === 3) {
            const moisture = parseInt(steps[2]);
            if (isNaN(moisture)) {
              response = end('Invalid input. Please enter a number.');
            } else if (moisture <= 13) {
              response = end('Grade: Premium (Low Moisture).\nYou qualify for top buyer prices!');
            } else {
              response = end('Grade: Standard (High Moisture).\nDry your maize further for better prices.');
            }
          }
        } 
        else if (steps[1] === '6') {
          if (step === 2) response = con('We will send an OTP to your phone.\n1. Send OTP\n0. Back');
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
                response = end('OTP sent! Use it to login on smartshamba.vercel.app');
              }
            }
          }
        }
      }
    } 

    // ── BUYER SECTION ───────────────────────────────────────────────────────
    else if (steps[0] === '2') {
      // UNREGISTERED BUYER
      if (!buyer) {
        if (step === 1) {
          response = con('New Buyer Registration\n1. Company / Organisation\n2. Individual / Small Scale\n0. Back');
        } 
        else if (step === 2) {
          // steps[1] = Type
          if (steps[1] === '1') response = con('Enter Company Name:');
          else if (steps[1] === '2') response = con('Enter your Full Name:');
          else response = end('Invalid option. Please try again.');
        } 
        else if (step === 3) {
          // steps[2] = Name
          response = con('Enter ID / Company Reg No.\n(for verification):');
        } 
        else if (step === 4) {
          // steps[3] = ID/Reg
          response = con('Enter your Location\n(e.g. Trans Nzoia, Kitale):');
        } 
        else if (step === 5) {
          // steps[4] = Location
          const type = steps[1] === '1' ? 'COMPANY' : 'INDIVIDUAL';
          const name = steps[2];
          const regNo = steps[3];
          const location = steps[4];
          
          await prisma.buyer.create({
            data: {
              phone: phoneNumber,
              name,
              location,
              // Note: Prisma Buyer model doesn't have type/regNo fields mapped exactly this way,
              // but we can save it in the name/location for now, or update schema later.
              // For now, we save core fields to allow login.
              pricePerBag: 0, // Default, to be updated via web
              capacityBags: 0,
              active: true,
            }
          });
          
          response = con(`Registration successful!\nWe will send an OTP to login on the website.\n\n1. Send OTP\n2. Skip`);
        } 
        else if (step === 6) {
          // steps[5] = OTP Choice
          if (steps[5] === '1') {
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
              response = end('OTP sent! Use it to login on smartshamba.vercel.app');
            }
          } else {
            response = end('Thank you for registering. Dial *384*53374# to manage your account.');
          }
        }
      } 
      
      // REGISTERED BUYER MENU
      else {
        if (step === 1) {
          response = con(`Buyer Menu\n\n1. Browse Available Produce\n2. Post Buying Offer\n3. My Transactions\n4. Website Login\n0. Back`);
        } 
        else if (steps[1] === '1') {
          // BROWSE PRODUCE
          if (step === 2) {
            const farmers = await prisma.farmer.findMany({ take: 5, select: { name: true, location: true, village: true } });
            const list = farmers.map((f, i) => `${i + 1}. ${f.name ?? 'Farmer'}\n   ${f.village ?? f.location ?? ''}`).join('\n');
            response = end(`Available Produce (Farmers):\n${list}\n\nVisit website for details.`);
          }
        } 
        else if (steps[1] === '2') {
          // POST BUYING OFFER
          if (step === 2) response = con('Set Price per 90kg bag (KSh):');
          else if (step === 3) {
            const price = parseInt(steps[2]);
            if (isNaN(price) || price <= 0) {
              response = end('Invalid price. Please try again.');
            } else {
              await prisma.buyer.update({ where: { phone: phoneNumber }, data: { pricePerBag: price } });
              response = end('Buying offer updated! Farmers can now see your price.');
            }
          }
        } 
        else if (steps[1] === '3') {
          // MY TRANSACTIONS
          if (step === 2) {
            const transactions = await prisma.transaction.findMany({
              where: { buyer: { phone: phoneNumber } },
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: { farmer: true },
            });
            if (transactions.length === 0) {
              response = end('You have no transactions yet.');
            } else {
              const list = transactions.map((t, i) => `${i + 1}. ${t.farmer.name ?? 'Farmer'}\n   ${t.status} - ${t.quantityBags} bags`).join('\n');
              response = end(`My transactions:\n${list}`);
            }
          }
        } 
        else if (steps[1] === '4') {
          // WEBSITE LOGIN
          if (step === 2) response = con('We will send an OTP to your phone.\n1. Send OTP\n0. Back');
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
                response = end('OTP sent! Use it to login on smartshamba.vercel.app');
              }
            }
          }
        }
      }
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
      response = end('Thank you for using SmartShamba. Goodbye!');
    }

    return new NextResponse(response, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('[USSD] Handler error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return new NextResponse('END Service error. Please try again later.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
