import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/admin/groups/[id]/members
 * List all members in a farmer group
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const group = await prisma.farmerGroup.findUnique({
      where: {
        id,
      },
      include: {
        members: {
          include: {
            farmer: {
              include: {
                county: true,
                ward: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
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

    return NextResponse.json(group.members);
  } catch (error) {
    console.error("[ADMIN_GROUP_MEMBERS_GET]", error);

    return NextResponse.json(
      {
        error: "Failed to load members",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PATCH /api/admin/groups/[id]/members
 * Update a member's pledged bags
 *
 * Body:
 * {
 *   memberId: "...",
 *   bagsPledged: 40
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const {
      memberId,
      bagsPledged,
    } = body;

    if (!memberId) {
      return NextResponse.json(
        {
          error: "memberId is required",
        },
        {
          status: 400,
        }
      );
    }

    const member = await prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId: id,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          error: "Member not found",
        },
        {
          status: 404,
        }
      );
    }

    const updated = await prisma.groupMember.update({
      where: {
        id: memberId,
      },
      data: {
        bagsPledged,
      },
      include: {
        farmer: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN_GROUP_MEMBER_PATCH]", error);

    return NextResponse.json(
      {
        error: "Failed to update pledge",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/admin/groups/[id]/members
 * Remove a member from the group
 *
 * Body:
 * {
 *   memberId: "..."
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const {
      memberId,
    } = body;

    if (!memberId) {
      return NextResponse.json(
        {
          error: "memberId is required",
        },
        {
          status: 400,
        }
      );
    }

    const member = await prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId: id,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          error: "Member not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.groupMember.delete({
      where: {
        id: memberId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("[ADMIN_GROUP_MEMBER_DELETE]", error);

    return NextResponse.json(
      {
        error: "Failed to remove member",
      },
      {
        status: 500,
      }
    );
  }
}