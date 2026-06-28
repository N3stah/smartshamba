import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const buyer = await prisma.buyer.create({
      data: {
        name: body.name,
        location: body.location,
        pricePerBag: Number(body.pricePerBag),
        capacityBags: Number(body.capacityBags),
        verified: true,
        active: true,
      },
    });

    return NextResponse.json(buyer);
  } catch (error) {
    console.error("[ADMIN_BUYERS_POST]", error);

    return NextResponse.json(
      { error: "Failed to create buyer" },
      { status: 500 }
    );
  }
}
