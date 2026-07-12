import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";

// GET /api/admin/groups
// Returns all farmer groups with summary statistics.
export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);

  if (auth) {
    return auth;
  }

  try {
    const groups = await prisma.farmerGroup.findMany({
      include: {
        county: {
          select: {
            name: true,
          },
        },

        ward: {
          select: {
            name: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },

        members: {
          select: {
            bagsPledged: true,
          },
        },

        _count: {
          select: {
            members: true,
            transactions: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const result = groups.map((group) => {
      const totalBagsPledged = group.members.reduce(
        (sum, member) => sum + member.bagsPledged,
        0
      );

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        active: group.active,

        village: group.village,

        county: group.county?.name ?? null,
        ward: group.ward?.name ?? null,

        createdAt: group.createdAt,
        updatedAt: group.updatedAt,

        createdBy: group.createdBy,

        memberCount: group._count.members,
        transactionCount: group._count.transactions,

        totalBagsPledged,
      };
    });

    console.log(
      "[ADMIN GROUPS] Loaded",
      result.length,
      "groups"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "[ADMIN GROUPS] GET error:",
      error instanceof Error ? error.message : error
    );

    Sentry.captureException(error);
    await Sentry.flush(2000);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}