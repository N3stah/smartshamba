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

const DISPUTE_REASONS: Record<number, string> = {
  1: 'QUANTITY_MISMATCH',
  2: 'QUALITY_REJECTED',
  3: 'PAYMENT_DELAY',
  4: 'BUYER_UNRESPONSIVE',
  5: 'PRICE_CHANGED',
  6: 'OTHER',
};

const DISPUTE_REASON_LABELS: Record<number, string> = {
  1: 'Quantity wrong',
  2: 'Quality rejected',
  3: 'Payment delayed',
  4: 'Buyer unreachable',
  5: 'Price changed',
  6: 'Other',
};

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

      // STEP 0 — Main menu
      if (step === 0) {
        response = con(`Welcome back ${farmer.name ?? 'Farmer'}!\n1. Sell Maize\n2. My Transactions\n3. Report Issue`);
      }

      // STEP 1 — Handle main menu selection
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

        } else if (steps[0] === '3') {
          const eligibleTxs = await prisma.transaction.findMany({
            where: {
              farmerId: farmer.id,
              status: { in: ['SETTLED', 'DELIVERED'] },
              dispute: null,
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { buyer: { select: { name: true } } },
          });
          if (eligibleTxs.length === 0) {
            response = end('No eligible transactions.\nOnly SETTLED or DELIVERED\ntransactions can be disputed.');
          } else {
            const list = eligibleTxs
              .map((t, i) => `${i + 1}. ${t.buyer.name}\n   ${t.reference.slice(-8)}`)
              .join('\n');
            response = con(`Select transaction:\n${list}`);
          }

        } else {
          response = end('Invalid option. Please dial *384*53374# to try again.');
        }
      }

      // STEP 2 — Second-level selection
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

        } else if (steps[0] === '3') {
          const eligibleTxs = await prisma.transaction.findMany({
            where: {
              farmerId: farmer.id,
              status: { in: ['SETTLED', 'DELIVERED'] },
              dispute: null,
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { buyer: { select: { name: true } } },
          });
          const txIndex    = parseInt(steps[1]) - 1;
          const selectedTx = eligibleTxs[txIndex];
          if (!selectedTx) {
            response = end('Invalid selection. Please dial *384*53374# to try again.');
          } else {
            const reasonList = Object.entries(DISPUTE_REASON_LABELS)
              .map(([num, label]) => `${num}. ${label}`)
              .join('\n');
            response = con(
              `${selectedTx.buyer.name}\nRef: ${selectedTx.reference.slice(-8)}\n\nSelect issue:\n${reasonList}`
            );
          }

        } else {
          response = end('Invalid session. Please dial *384*53374# to start again.');
        }
      }

      // STEP 3 — Third-level
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

      else if (step === 3 && steps[0] === '3') {
        const eligibleTxs = await prisma.transaction.findMany({
          where: {
            farmerId: farmer.id,
            status: { in: ['SETTLED', 'DELIVERED'] },
            dispute: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { buyer: { select: { name: true } } },
        });
        const txIndex     = parseInt(steps[1]) - 1;
        const selectedTx  = eligibleTxs[txIndex];
        const reasonNum   = parseInt(steps[2]);
        const reasonLabel = DISPUTE_REASON_LABELS[reasonNum];
        if (!selectedTx || !reasonLabel) {
          response = end('Invalid selection. Please dial *384*53374# to try again.');
        } else {
          response = con(
            `Confirm report:\n${selectedTx.buyer.name}\nIssue: ${reasonLabel}\n\n1. Confirm\n2. Cancel`
          );
        }
      }

      // STEP 4 — Confirm actions
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

      else if (step === 4 && steps[0] === '3') {
        if (steps[3] === '2') {
          response = end('Report cancelled. Dial *384*53374# to start again.');
        } else if (steps[3] === '1') {
          const eligibleTxs = await prisma.transaction.findMany({
            where: {
              farmerId: farmer.id,
              status: { in: ['SETTLED', 'DELIVERED'] },
              dispute: null,
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          });
          const txIndex    = parseInt(steps[1]) - 1;
          const selectedTx = eligibleTxs[txIndex];
          const reasonEnum = DISPUTE_REASONS[parseInt(steps[2])] as
            | 'QUANTITY_MISMATCH' | 'QUALITY_REJECTED' | 'PAYMENT_DELAY'
            | 'BUYER_UNRESPONSIVE' | 'PRICE_CHANGED' | 'OTHER'
            | undefined;

          if (!selectedTx || !reasonEnum) {
            response = end('Invalid session. Please dial *384*53374# to try again.');
          } else {
            await prisma.$transaction([
              prisma.dispute.create({
                data: {
                  transactionId: selectedTx.id,
                  farmerId:      farmer.id,
                  buyerId:       selectedTx.buyerId,
                  reason:        reasonEnum,
                  status:        'OPEN',
                },
              }),
              prisma.transaction.update({
                where: { id: selectedTx.id },
                data:  { status: 'DISPUTED' },
              }),
            ]);
            console.log('[USSD] Dispute created for tx:', selectedTx.id, 'reason:', reasonEnum);
            response = end(
              `Issue reported.\nRef: ${selectedTx.reference.slice(-8)}\nOur team will review\nand contact you within 48 hours.`
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
        const countyList = PILOT_COUNTIES.map((c, i) => `${i + 1}. ${c}`).join('\n');
        response = con(`Select your county:\n${countyList}\n8. Other county`);
      }

      else if (step === 2) {
        const countyChoice = parseInt(steps[1]);
        if (countyChoice === 8) {
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
        const countyChoice = parseInt(steps[1]);
        if (countyChoice === 8) {
          const name     = steps[0];
          const location = steps[2];
          await prisma.farmer.create({ data: { phone: phoneNumber, name, location } });
          console.log('[USSD] Registered new farmer (other county):', phoneNumber);
          response = end(
            `Welcome ${name}!\nYou are now registered.\nDial *384*53374# to start selling maize.`
          );
        } else {
          const wardChoice = parseInt(steps[2]);
          if (wardChoice === 9) {
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
                response = con(`Ward: ${selectedWard.name}\n\nEnter your village name:`);
              }
            }
          }
        }
      }

      else if (step === 4) {
        const countyChoice = parseInt(steps[1]);
        const name         = steps[0];
        const village      = steps[3];

        if (countyChoice === 8) {
          response = end('Invalid session. Please dial *384*53374# to try again.');
        } else {
          const wardChoice = parseInt(steps[2]);
          const countyName = PILOT_COUNTIES[countyChoice - 1];
          const county     = await prisma.county.findUnique({ where: { name: countyName } });

          if (!county) {
            response = end('Service error. Please dial *384*53374# to try again.');
          } else if (wardChoice === 9) {
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
                  phone:    phoneNumber,
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