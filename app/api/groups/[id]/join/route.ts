import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';

// POST /api/groups/[id]/join
// Join an existing farmer group.
export async function POST(
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
      bagsPledged < 1 ||
      bagsPledged > 500
    ) {
      return NextResponse.json(
        {
          error: 'bagsPledged must be an integer between 1 and 500',
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

    const group = await prisma.farmerGroup.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        {
          error: 'Group not found',
        },
        {
          status: 404,
        }
      );
    }

    if (!group.active) {
      return NextResponse.json(
        {
          error: 'This group is no longer accepting members',
        },
        {
          status: 400,
        }
      );
    }

    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_farmerId: {
          groupId,
          farmerId: farmer.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          error: 'You are already a member of this group',
        },
        {
          status: 409,
        }
      );
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        farmerId: farmer.id,
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
      '[GROUPS] Farmer joined group:',
      group.name,
      'bags:',
      bagsPledged
    );

    return NextResponse.json(member, {
      status: 201,
    });
  } catch (error) {
    console.error(
      '[GROUPS] JOIN error:',
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