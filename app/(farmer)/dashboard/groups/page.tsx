import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

import GroupCard, {
  Group,
} from "@/components/groups/GroupCard";
import GroupStats from "@/components/groups/GroupStats";

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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Farmer Groups
          </h1>

          <p className="text-gray-500 mt-1">
            Join nearby farmers, combine harvests and negotiate
            better prices together.
          </p>
        </div>

        <Link
          href="/dashboard/groups/create"
          className="bg-green-700 hover:bg-green-600 text-white px-5 py-3 rounded-lg transition-colors"
        >
          Create Group
        </Link>
      </div>

      <GroupStats
        totalGroups={enriched.length}
        totalMembers={totalMembers}
        totalBags={totalBags}
      />

      {enriched.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            No Groups Found
          </h2>

          <p className="text-gray-500 mt-2">
            There are currently no farmer groups in your area.
          </p>

          <Link
            href="/dashboard/groups/create"
            className="inline-block mt-6 bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
          >
            Create the First Group
          </Link>
        </div>
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