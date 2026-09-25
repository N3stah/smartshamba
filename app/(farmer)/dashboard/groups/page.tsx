export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

import GroupCard, {
  Group,
} from "@/components/groups/GroupCard";
import GroupStats from "@/components/groups/GroupStats";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function GroupsPage() {
  const cookieStore = await cookies();

  const phone = cookieStore.get("smartshamba_farmer")?.value;

  if (!phone) {
    redirect("/dashboard/login?from=/dashboard/groups");
  }

  const farmer = await prisma.farmer.findUnique({
    where: {
      phone,
    },
    select: {
      countyId: true,
      wardId: true,
    },
  });

  if (!farmer) {
    redirect("/dashboard/login");
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
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const enriched: Group[] = groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    village: group.village,

    county: group.county
      ? {
          name: group.county.name,
        }
      : null,

    ward: group.ward
      ? {
          name: group.ward.name,
        }
      : null,

    memberCount: group._count.members,

    totalBagsPledged: group.members.reduce(
      (sum, member) => sum + member.bagsPledged,
      0
    ),
  }));

  const totalMembers = enriched.reduce(
    (sum, group) => sum + group.memberCount,
    0
  );

  const totalBags = enriched.reduce(
    (sum, group) => sum + group.totalBagsPledged,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Farmer Groups
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Join nearby farmers, combine harvests and negotiate better prices together.
          </p>
        </div>
        <Link href="/dashboard/groups/create">
          <Button size="lg">
            Create Group
          </Button>
        </Link>
      </div>

      <GroupStats
        totalGroups={enriched.length}
        totalMembers={totalMembers}
        totalBags={totalBags}
      />

      {enriched.length === 0 ? (
        <Card className="p-12 text-center">
          <h2 className="text-lg font-semibold text-text">
            No Groups Found
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            There are currently no farmer groups in your area.
          </p>
          <Link href="/dashboard/groups/create" className="inline-block mt-6">
            <Button>Create the First Group</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enriched.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
            />
          ))}
        </div>
      )}
    </div>
  );
}
