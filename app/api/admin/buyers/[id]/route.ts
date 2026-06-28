import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;

    const buyer = await prisma.buyer.update({
      where: { id },
      data: {
        name: body.name,
        location: body.location,
        pricePerBag: Number(body.pricePerBag),
        capacityBags: Number(body.capacityBags),
        verified: body.verified,
        active: body.active,
      },
    });

    return NextResponse.json(buyer);
  } catch (error) {
    console.error("[ADMIN_BUYERS_PUT]", error);

    return NextResponse.json(
      { error: "Failed to update buyer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.buyer.update({
      where: { id },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[ADMIN_BUYERS_DELETE]", error);

    return NextResponse.json(
      { error: "Failed to deactivate buyer" },
      { status: 500 }
    );
  }
}
