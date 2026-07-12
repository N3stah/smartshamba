import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';

// PATCH /api/groups/[id]/pledge
// Update the number of bags pledged by the authenticated farmer.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const phone = getFarmerSession(req);

  if (!phone) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id: groupId } = await params;

    const body = await req.json();

    const bagsPledged = Number(body.bagsPledged);

    if (
      !Number.isInteger(bagsPledged) ||
      bagsPledged < 0 ||
      bagsPledged > 500
    ) {
      return NextResponse.json(
        {
          error: 'bagsPledged must be an integer between 0 and 500',
        },
        {
          status: 400,
        }
      );
    }

    const farmer = await prisma.farmer.findUnique({
      where: {
        phone,
      },
      select: {
        id: true,
      },
    });

    if (!farmer) {
      return NextResponse.json(
        {
          error: 'Farmer not found',
        },
        {
          status: 404,
        }
      );
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_farmerId: {
          groupId,
          farmerId: farmer.id,
        },
      },
      include: {
        group: {
          select: {
            id: true,
            active: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'You are not a member of this group',
        },
        {
          status: 403,
        }
      );
    }

    if (!membership.group.active) {
      return NextResponse.json(
        {
          error: 'This group is no longer active',
        },
        {
          status: 400,
        }
      );
    }

    const updatedMembership = await prisma.groupMember.update({
      where: {
        groupId_farmerId: {
          groupId,
          farmerId: farmer.id,
        },
      },
      data: {
        bagsPledged,
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    console.log(
      '[GROUPS] Updated pledge:',
      {
        groupId,
        farmerId: farmer.id,
        bagsPledged,
      }
    );

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error(
      '[GROUPS] PLEDGE error:',
      error instanceof Error ? error.message : error
    );

    Sentry.captureException(error);
    await Sentry.flush(2000);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}