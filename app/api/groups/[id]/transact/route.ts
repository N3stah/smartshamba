import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { groupTransactionTemplate } from '@/lib/notifications/templates';

function generateGroupRef(): string {
  return `GRP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const phone = getFarmerSession(req);
  if (!phone) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id: groupId } = await params;
    const { buyerId }     = await req.json();

    if (!buyerId) {
      return NextResponse.json({ error: 'buyerId is required' }, { status: 400 });
    }

    const farmer = await prisma.farmer.findUnique({ where: { phone }, select: { id: true } });
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_farmerId: { groupId, farmerId: farmer.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Only group members can confirm a sale' }, { status: 403 });
    }

    const group = await prisma.farmerGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { farmer: { select: { phone: true, name: true } } },
        },
      },
    });
    if (!group)        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (!group.active) return NextResponse.json({ error: 'Group is not active' }, { status: 400 });

    if (group.members.length < 2) {
      return NextResponse.json(
        { error: 'Group needs at least 2 members to confirm a sale' },
        { status: 400 }
      );
    }

    const totalBags = group.members.reduce((sum, m) => sum + m.bagsPledged, 0);
    if (totalBags < 1) {
      return NextResponse.json(
        { error: 'No bags pledged. Members must pledge bags before confirming a sale' },
        { status: 400 }
      );
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: { id: true, name: true, pricePerBag: true, active: true },
    });
    if (!buyer || !buyer.active) {
      return NextResponse.json({ error: 'Buyer not found or inactive' }, { status: 404 });
    }

    const reference  = generateGroupRef();
    const totalValue = buyer.pricePerBag * totalBags;

    const groupTx = await prisma.groupTransaction.create({
      data: {
        groupId, buyerId, reference, totalBags,
        pricePerBag: buyer.pricePerBag, totalValue, status: 'PENDING',
      },
    });

    console.log('[GROUPS] Group transaction created:', reference, 'bags:', totalBags);

    // Send individual SMS to each member via the notification system
    for (const member of group.members) {
      const body = groupTransactionTemplate({
        groupName:  group.name,
        buyerName:  buyer.name,
        reference,
        totalBags,
        pricePerBag: buyer.pricePerBag,
        totalValue,
      });
      sendNotification({
        type:           'GROUP_TRANSACTION',
        recipientPhone: member.farmer.phone,
        body,
      }).catch((err) => {
        console.error('[GROUPS] SMS failed for member:', (err as Error).message);
      });
    }

    return NextResponse.json(groupTx, { status: 201 });
  } catch (error) {
    console.error('[GROUPS] TRANSACT error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
