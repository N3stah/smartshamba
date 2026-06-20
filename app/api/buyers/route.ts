// app/api/buyers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all active buyers from your Supabase instance
    const buyers = await prisma.buyer.findMany({
      where: {
        active: true,
      },
      orderBy: {
        pricePerBag: 'desc', // Show the best deals for farmers at the top
      },
    });

    return NextResponse.json(buyers);
  } catch (error) {
    console.error("[BUYERS] Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}