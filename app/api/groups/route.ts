import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getFarmerSession } from '@/lib/auth';

// POST /api/groups
// Create a farmer group
export async function POST(req: NextRequest) {
  const phone = getFarmerSession(req);

  if (!phone) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : null;

    const village =
      typeof body.village === 'string'
        ? body.village.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: {
        id: true,
        countyId: true,
        wardId: true,
        village: true,
      },
    });

    if (!farmer) {
      return NextResponse.json(
        { error: 'Farmer not found' },
        { status: 404 }
      );
    }

    const group = await prisma.farmerGroup.create({
      data: {
        name,
        description,
        village: village ?? farmer.village ?? null,
        countyId: farmer.countyId ?? null,
        wardId: farmer.wardId ?? null,
        createdById: farmer.id,

        members: {
          create: {
            farmerId: farmer.id,
            bagsPledged: 0,
          },
        },
      },

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

        members: true,
      },
    });

    console.log(
      '[GROUPS] Created group:',
      group.id,
      group.name
    );

    return NextResponse.json(group, {
      status: 201,
    });
  } catch (error) {
    console.error(
      '[GROUPS] POST error:',
      error instanceof Error ? error.message : error
    );

    Sentry.captureException(error);
    await Sentry.flush(2000);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/groups
// Returns nearby groups:
// 1. Same ward
// 2. Same county
// 3. All active groups
export async function GET(req: NextRequest) {
  const phone = getFarmerSession(req);

  if (!phone) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const farmer = await prisma.farmer.findUnique({
      where: { phone },
      select: {
        countyId: true,
        wardId: true,
      },
    });

    if (!farmer) {
      return NextResponse.json(
        { error: 'Farmer not found' },
        { status: 404 }
      );
    }

    const where = farmer.wardId
      ? {
          wardId: farmer.wardId,
          active: true,
        }
      : farmer.countyId
        ? {
            countyId: farmer.countyId,
            active: true,
          }
        : {
            active: true,
          };

    const groups = await prisma.farmerGroup.findMany({
      where,

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
        createdAt: 'desc',
      },
    });

    const enrichedGroups = groups.map((group) => ({
      ...group,

      memberCount: group._count.members,

      transactionCount: group._count.transactions,

      totalBagsPledged: group.members.reduce(
        (sum, member) => sum + member.bagsPledged,
        0
      ),
    }));

    console.log(
      '[GROUPS] Nearby groups:',
      enrichedGroups.length
    );

    return NextResponse.json(enrichedGroups);
  } catch (error) {
    console.error(
      '[GROUPS] GET error:',
      error instanceof Error ? error.message : error
    );

    Sentry.captureException(error);
    await Sentry.flush(2000);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}