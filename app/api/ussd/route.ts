import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { con, end, parseText } from '@/lib/africastalking';
import { checkRateLimit } from '@/lib/rateLimit';

function validateAtRequest(req: NextRequest): boolean {
  if (process.env.AT_USERNAME === 'sandbox') return true;
  const apiKey = req.headers.get('apiKey');
  return apiKey === process.env.AT_API_KEY;
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
    const sessionId   = formData.get('sessionId') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const text        = formData.get('text') as string ?? '';

    // Rate limit check
    const rateCheck = checkRateLimit(phoneNumber);
    if (!rateCheck.allowed) {
      return new NextResponse(
        `END Too many requests. Please wait ${rateCheck.retryAfter}s before trying again.`,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const steps = parseText(text);
    const step  = steps.length;
    let response: string;

    if (step === 0) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
      if (!farmer) {
        response = con('Welcome to SmartShamba\nYou are not registered.\nEnter your name to register:');
      } else {
        response = con(`Welcome back ${farmer.name ?? 'Farmer'}!\n1. View buyer offers\n2. My transactions`);
      }
    }

    else if (step === 1) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
      if (!farmer) {
        response = con('Enter your location (e.g. Kitale, Endebess):');
      } else {
        if (steps[0] === '1') {
          const buyers = await prisma.buyer.findMany({
            where: { active: true },
            orderBy: { pricePerBag: 'desc' },
            take: 3,
          });
          const buyerList = buyers.map((b, i) => `${i + 1}. ${b.name} - KSh ${b.pricePerBag}/bag`).join('\n');
          response = con(`Current buyer offers:\n${buyerList}\n\nSelect buyer number:`);
        } else if (steps[0] === '2') {
          const transactions = await prisma.transaction.findMany({
            where: { farmer: { phone: phoneNumber } },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { buyer: true },
          });
          if (transactions.length === 0) {
            response = end('You have no transactions yet.\nDial *384*53374# to create your first offer.');
          } else {
            const txList = transactions.map((t, i) => `${i + 1}. ${t.buyer.name} - ${t.status} - KSh ${t.totalValue.toLocaleString()}`).join('\n');
            response = con(`My transactions:\n${txList}\n\nSelect transaction number for details:`);
          }
        } else {
          response = end('Invalid option. Please try again.');
        }
      }
    }

    else if (step === 2) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
      if (!farmer) {
        const name     = steps[0];
        const location = steps[1];
        await prisma.farmer.create({ data: { phone: phoneNumber, name, location } });
        response = con(`Registered! Welcome ${name}.\n1. View buyer offers\n2. My transactions`);
      } else {
        if (steps[0] === '1') {
          const buyers = await prisma.buyer.findMany({
            where: { active: true },
            orderBy: { pricePerBag: 'desc' },
            take: 3,
          });
          const buyerIndex    = parseInt(steps[1]) - 1;
          const selectedBuyer = buyers[buyerIndex];
          if (!selectedBuyer) {
            response = end('Invalid selection. Please try again.');
          } else {
            response = con(`${selectedBuyer.name}\nPrice: KSh ${selectedBuyer.pricePerBag}/bag\nLocation: ${selectedBuyer.location}\n\nEnter number of bags:`);
          }
        } else if (steps[0] === '2') {
          const transactions = await prisma.transaction.findMany({
            where: { farmer: { phone: phoneNumber } },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { buyer: true },
          });
          const txIndex = parseInt(steps[1]) - 1;
          const selectedTx = transactions[txIndex];
          if (!selectedTx) {
            response = end('Invalid selection. Please try again.');
          } else {
            response = end(`Ref: ${selectedTx.reference}\nBuyer: ${selectedTx.buyer.name}\nBags: ${selectedTx.quantityBags}\nPrice: KSh ${selectedTx.pricePerBag}/bag\nTotal: KSh ${selectedTx.totalValue.toLocaleString()}\nStatus: ${selectedTx.status}\nDate: ${selectedTx.createdAt.toLocaleDateString()}`);
          }
        } else {
          response = end('Invalid option. Please try again.');
        }
      }
    }

    else if (step === 3) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
      if (!farmer) {
        response = end('Session expired. Please dial again.');
      } else {
        if (steps[0] === '1') {
          const buyers = await prisma.buyer.findMany({
            where: { active: true },
            orderBy: { pricePerBag: 'desc' },
            take: 3,
          });
          const buyerIndex    = parseInt(steps[1]) - 1;
          const selectedBuyer = buyers[buyerIndex];
          const quantity      = parseInt(steps[2]);
          if (!selectedBuyer || isNaN(quantity) || quantity <= 0) {
            response = end('Invalid input. Please try again.');
          } else {
            const total = selectedBuyer.pricePerBag * quantity;
            response = con(`Confirm offer:\nBuyer: ${selectedBuyer.name}\nBags: ${quantity}\nTotal: KSh ${total.toLocaleString()}\n\n1. Confirm\n2. Cancel`);
          }
        } else {
          response = end('Invalid session. Please dial *384*53374# to start again.');
        }
      }
    }

    else if (step === 4) {
      const farmer = await prisma.farmer.findUnique({ where: { phone: phoneNumber } });
      if (!farmer) {
        response = end('Session expired. Please dial again.');
      } else {
        if (steps[0] !== '1') {
          response = end('Invalid session. Please dial *384*53374# to start again.');
        } else {
          if (steps[3] !== '1') {
            response = end('Offer cancelled. Dial *384*53374# to start again.');
          } else {
            const buyers = await prisma.buyer.findMany({
              where: { active: true },
              orderBy: { pricePerBag: 'desc' },
              take: 3,
            });
            const buyerIndex    = parseInt(steps[1]) - 1;
            const selectedBuyer = buyers[buyerIndex];
            const quantity      = parseInt(steps[2]);
            if (!selectedBuyer || isNaN(quantity) || quantity <= 0) {
              response = end('Invalid session data. Please try again.');
            } else {
              const reference  = `SS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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
              response = end(`Offer confirmed!\nRef: ${reference}\nBuyer: ${selectedBuyer.name}\n${quantity} bags @ KSh ${selectedBuyer.pricePerBag}\nTotal: KSh ${totalValue.toLocaleString()}\nThe buyer will contact you.`);
            }
          }
        }
      }
    }

    else {
      response = end('Invalid session. Please dial *384*53374# to start again.');
    }

    return new NextResponse(response, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('[POST /api/ussd]', error);
    return new NextResponse('END Service error. Please try again later.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}