import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getFarmerSession } from "@/lib/auth";
import { sendSms } from "@/lib/sms";

function generateGroupReference(): string {
  return `GRP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;
}

// POST /api/groups/[id]/transact
// Confirms a group sale to a buyer.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const phone = getFarmerSession(req);

  if (!phone) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id: groupId } = await params;
    const body = await req.json();

    const buyerId =
      typeof body.buyerId === "string"
        ? body.buyerId.trim()
        : "";

    if (!buyerId) {
      return NextResponse.json(
        { error: "buyerId is required" },
        { status: 400 }
      );
    }

    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: { id: true, name: true },
    });

    if (!farmer) {
      return NextResponse.json(
        { error: "Farmer not found" },
        { status: 404 }
      );
    }

    // Ensure farmer belongs to the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_farmerId: {
          groupId,
          farmerId: farmer.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only group members can create a group sale." },
        { status: 403 }
      );
    }

    // Load the group with every member
    const group = await prisma.farmerGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    if (!group.active) {
      return NextResponse.json(
        { error: "Group is inactive" },
        { status: 400 }
      );
    }

    if (group.members.length < 2) {
      return NextResponse.json(
        {
          error:
            "A group must have at least two members before making a sale.",
        },
        { status: 400 }
      );
    }

    const totalBags = group.members.reduce(
      (sum, member) => sum + member.bagsPledged,
      0
    );

    if (totalBags <= 0) {
      return NextResponse.json(
        {
          error:
            "Members must pledge bags before creating a group sale.",
        },
        { status: 400 }
      );
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        name: true,
        pricePerBag: true,
        active: true,
      },
    });

    if (!buyer || !buyer.active) {
      return NextResponse.json(
        { error: "Buyer not found or inactive" },
        { status: 404 }
      );
    }

    const reference = generateGroupReference();
    const totalValue = buyer.pricePerBag * totalBags;

    const transaction = await prisma.groupTransaction.create({
      data: {
        groupId,
        buyerId,
        reference,
        totalBags,
        pricePerBag: buyer.pricePerBag,
        totalValue,
        status: "PENDING",
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(
      "[GROUPS] Created transaction:",
      transaction.reference
    );

    const smsMessage =
      `SmartShamba\n\n` +
      `Your group "${group.name}" has confirmed a sale.\n\n` +
      `Buyer: ${buyer.name}\n` +
      `Reference: ${reference}\n` +
      `Bags: ${totalBags}\n` +
      `Price/Bag: KSh ${buyer.pricePerBag.toLocaleString()}\n` +
      `Total: KSh ${totalValue.toLocaleString()}\n\n` +
      `Payment will be processed after delivery confirmation.`;

    // Fire-and-forget SMS notifications
    await Promise.allSettled(
      group.members.map((member) =>
        sendSms(member.farmer.phone, smsMessage)
      )
    );

    return NextResponse.json(transaction, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "[GROUPS] TRANSACT error:",
      error instanceof Error ? error.message : error
    );

    Sentry.captureException(error);
    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}