import * as Sentry from '@sentry/nextjs';
import { sendOfferConfirmationSms } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { con, end, parseText } from '@/lib/africastalking';
import { checkRateLimit } from '@/lib/rateLimit';

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
        `END Too many requests. Please wait ${rateCheck.retryAfter}s before trying again.`,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const steps = parseText(text);
    const step  = steps.length;

    const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
    let response: string;

    // ── REGISTERED FARMER PATH ──────────────────────────────────────────────

    if (farmer) {

      if (step === 0) {
        response = con(`Welcome back ${farmer.name ?? 'Farmer'}!\n1. Sell Maize\n2. My Transactions`);
      }

      else if (step === 1) {
        if (steps[0] === '1') {
          const buyers = await prisma.buyer.findMany({
            where: { active: true },
            orderBy: { pricePerBag: 'desc' },
            take: 5,
          });
          const list = buyers.map((b, i) => `${i + 1}. ${b.name}\n   KSh ${b.pricePerBag}/bag`).join('\n');
          response = con(`Buyer offers:\n${list}\n\nSelect buyer number:`);
        } else if (steps[0] === '2') {
          const transactions = await prisma.transaction.findMany({
            where: { farmer: { phone: phoneNumber } },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { buyer: true },
          });
          if (transactions.length === 0) {
            response = end('You have no transactions yet.\nDial *384*53374# to sell maize.');
          } else {
            const list = transactions.map((t, i) =>
              `${i + 1}. ${t.buyer.name}\n   ${t.status} - KSh ${t.totalValue.toLocaleString()}`
            ).join('\n');
            response = con(`My transactions:\n${list}\n\nSelect number for details:`);
          }
        } else {
          response = end('Invalid option. Please dial *384*53374# to try again.');
        }
      }

      else if (step === 2) {
        if (steps[0] === '1') {
          const buyers = await prisma.buyer.findMany({
            where: { active: true },
            orderBy: { pricePerBag: 'desc' },
            take: 5,
          });
          const buyerIndex    = parseInt(steps[1]) - 1;
          const selectedBuyer = buyers[buyerIndex];
          if (!selectedBuyer) {
            response = end('Invalid selection. Please dial *384*53374# to try again.');
          } else {
            response = con(
              `${selectedBuyer.name}\nPrice: KSh ${selectedBuyer.pricePerBag}/bag\nLocation: ${selectedBuyer.location}\n\nEnter number of bags (max 500):`
            );
          }
        } else if (steps[0] === '2') {
          const transactions = await prisma.transaction.findMany({
            where: { farmer: { phone: phoneNumber } },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { buyer: true },
          });
          const txIndex    = parseInt(steps[1]) - 1;
          const selectedTx = transactions[txIndex];
          if (!selectedTx) {
            response = end('Invalid selection. Please dial *384*53374# to try again.');
          } else {
            response = end(
              `Ref: ${selectedTx.reference}\nBuyer: ${selectedTx.buyer.name}\nBags: ${selectedTx.quantityBags}\nPrice: KSh ${selectedTx.pricePerBag}/bag\nTotal: KSh ${selectedTx.totalValue.toLocaleString()}\nStatus: ${selectedTx.status}`
            );
          }
        } else {
          response = end('Invalid session. Please dial *384*53374# to start again.');
        }
      }

      else if (step === 3 && steps[0] === '1') {
        const buyers = await prisma.buyer.findMany({
          where: { active: true },
          orderBy: { pricePerBag: 'desc' },
          take: 5,
        });
        const buyerIndex    = parseInt(steps[1]) - 1;
        const selectedBuyer = buyers[buyerIndex];
        const quantity      = parseInt(steps[2]);
        if (!selectedBuyer || isNaN(quantity) || quantity <= 0 || quantity > 500) {
          response = end('Invalid input. Bags must be between 1 and 500. Please dial *384*53374# to try again.');
        } else {
          const total = selectedBuyer.pricePerBag * quantity;
          response = con(
            `Confirm offer:\nBuyer: ${selectedBuyer.name}\nBags: ${quantity}\nPrice: KSh ${selectedBuyer.pricePerBag}/bag\nTotal: KSh ${total.toLocaleString()}\n\n1. Confirm\n2. Cancel`
          );
        }
      }

      else if (step === 4 && steps[0] === '1') {
        if (steps[3] === '2') {
          response = end('Offer cancelled. Dial *384*53374# to start again.');
        } else if (steps[3] === '1') {
          const buyers = await prisma.buyer.findMany({
            where: { active: true },
            orderBy: { pricePerBag: 'desc' },
            take: 5,
          });
          const buyerIndex    = parseInt(steps[1]) - 1;
          const selectedBuyer = buyers[buyerIndex];
          const quantity      = parseInt(steps[2]);
          if (!selectedBuyer || isNaN(quantity) || quantity <= 0 || quantity > 500) {
            response = end('Invalid session data. Please dial *384*53374# to try again.');
          } else {
            const reference  = generateReference();
            const totalValue = selectedBuyer.pricePerBag * quantity;
            await prisma.transaction.create({
              data: {
                reference,
                farmerId:     farmer.id,
                buyerId:      selectedBuyer.id,
                quantityBags: quantity,
                pricePerBag:  selectedBuyer.pricePerBag,
                totalValue,
                status:       'PENDING',
              },
            });
            console.log('[USSD] Transaction created:', reference);
            try {
              const smsResult = await sendOfferConfirmationSms(
                phoneNumber,
                reference,
                selectedBuyer.name,
                quantity,
                selectedBuyer.pricePerBag,
                totalValue
              );
              console.log('[USSD] SMS result:', JSON.stringify(smsResult));
            } catch (err) {
              console.error('[USSD] SMS failed:', err);
            }
            response = end(
              `Offer confirmed!\nRef: ${reference}\nBuyer: ${selectedBuyer.name}\n${quantity} bags @ KSh ${selectedBuyer.pricePerBag}\nTotal: KSh ${totalValue.toLocaleString()}\nSMS sent. The buyer will contact you.`
            );
          }
        } else {
          response = end('Invalid option. Please dial *384*53374# to try again.');
        }
      }

      else {
        response = end('Invalid session. Please dial *384*53374# to start again.');
      }
    }

    // ── UNREGISTERED FARMER PATH ────────────────────────────────────────────

    else {

      if (step === 0) {
        response = con('Welcome to SmartShamba\nTrans Nzoia, Rift Valley\n& Western Kenya\n\nEnter your full name:');
      }

      else if (step === 1) {
        // steps[0] = name entered
        const countyList = PILOT_COUNTIES.map((c, i) => `${i + 1}. ${c}`).join('\n');
        response = con(`Select your county:\n${countyList}\n8. Other county`);
      }

      else if (step === 2) {
        // steps[0] = name, steps[1] = county selection
        const countyChoice = parseInt(steps[1]);
        if (countyChoice === 8) {
          // Other county — skip ward, ask for village/location
          response = con('Enter your location\n(county, town or village):');
        } else if (countyChoice >= 1 && countyChoice <= PILOT_COUNTIES.length) {
          const countyName = PILOT_COUNTIES[countyChoice - 1];
          const county     = await prisma.county.findUnique({ where: { name: countyName } });
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
          response = end('Invalid selection. Please dial *384*53374# to try again.');
        }
      }

      else if (step === 3) {
        // steps[0]=name, steps[1]=county, steps[2]=ward or free-text location
        const countyChoice = parseInt(steps[1]);
        if (countyChoice === 8) {
          // Other county — steps[2] is free-text location
          const name     = steps[0];
          const location = steps[2];
          await prisma.farmer.create({ data: { phone: phoneNumber, name, location } });
          console.log('[USSD] Registered new farmer (other county):', phoneNumber);
          response = end(
            `Welcome ${name}!\nYou are now registered.\nDial *384*53374# to start selling maize.`
          );
        } else {
          // Pilot county — steps[2] is ward selection
          const wardChoice = parseInt(steps[2]);
          if (wardChoice === 9) {
            // Other ward — ask for village as free text
            response = con('Enter your village or\nnearest town name:');
          } else {
            const countyName = PILOT_COUNTIES[countyChoice - 1];
            const county     = await prisma.county.findUnique({ where: { name: countyName } });
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
                // Ask for village
                response = con(`Ward: ${selectedWard.name}\n\nEnter your village name:`);
              }
            }
          }
        }
      }

      else if (step === 4) {
        // steps[0]=name, steps[1]=county, steps[2]=ward, steps[3]=village
        const countyChoice = parseInt(steps[1]);
        const name         = steps[0];
        const village      = steps[3];

        if (countyChoice === 8) {
          // Shouldn't reach here for other county (handled in step 3)
          response = end('Invalid session. Please dial *384*53374# to try again.');
        } else {
          const wardChoice = parseInt(steps[2]);
          const countyName = PILOT_COUNTIES[countyChoice - 1];
          const county     = await prisma.county.findUnique({ where: { name: countyName } });

          if (!county) {
            response = end('Service error. Please dial *384*53374# to try again.');
          } else if (wardChoice === 9) {
            // Other ward — village is free text location, register without wardId
            await prisma.farmer.create({
              data: { phone: phoneNumber, name, location: village, countyId: county.id, village },
            });
            console.log('[USSD] Registered new farmer (other ward):', phoneNumber);
            response = end(`Welcome ${name}!\nYou are now registered.\nDial *384*53374# to start selling maize.`);
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
              await prisma.farmer.create({
                data: {
                  phone: phoneNumber,
                  name,
                  location: `${selectedWard.name}, ${countyName}`,
                  countyId: county.id,
                  wardId:   selectedWard.id,
                  village,
                },
              });
              console.log('[USSD] Registered new farmer:', phoneNumber, countyName, selectedWard.name);
              response = end(`Welcome ${name}!\nCounty: ${countyName}\nWard: ${selectedWard.name}\nYou are now registered.\nDial *384*53374# to start selling maize.`);
            }
          }
        }
      }

      else {
        response = end('Invalid session. Please dial *384*53374# to start again.');
      }
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
