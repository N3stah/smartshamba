import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 5)}...${phone.slice(-3)}`;
}

// GET /api/groups/[id]
// Returns group details with masked member phone numbers.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const group = await prisma.farmerGroup.findUnique({
      where: {
        id,
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

        createdBy: {
          select: {
            name: true,
          },
        },

        members: {
          include: {
            farmer: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },

        transactions: {
          include: {
            buyer: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
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

    const result = {
      ...group,

      members: group.members.map((member) => ({
        ...member,

        farmer: {
          name: member.farmer.name ?? 'Farmer',
          phone: maskPhone(member.farmer.phone),
        },
      })),

      totalBagsPledged: group.members.reduce(
        (sum, member) => sum + member.bagsPledged,
        0
      ),

      memberCount: group.members.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      '[GROUPS] GET [id] error:',
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