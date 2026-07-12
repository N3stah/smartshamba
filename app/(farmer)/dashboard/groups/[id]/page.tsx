import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GroupDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const phone = cookieStore.get("smartshamba_farmer")?.value;

  if (!phone) {
    redirect(`/dashboard/login?from=/dashboard/groups/${id}`);
  }

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
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      transactions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const totalBags = group.members.reduce(
    (sum, member) => sum + member.bagsPledged,
    0
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {group.name}
            </h1>

            <p className="text-gray-500 mt-2">
              {group.description ?? "No description"}
            </p>
          </div>

          <Link
            href="/dashboard/groups"
            className="text-green-700 hover:underline"
          >
            ← Back
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div>
            <p className="text-xs uppercase text-gray-500">
              Members
            </p>

            <p className="text-2xl font-bold">
              {group.members.length}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">
              Bags Pledged
            </p>

            <p className="text-2xl font-bold">
              {totalBags}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">
              Ward
            </p>

            <p className="font-medium">
              {group.ward?.name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">
              County
            </p>

            <p className="font-medium">
              {group.county?.name ?? "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            Group Members
          </h2>
        </div>

        {group.members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No members yet.
          </div>
        ) : (
          <div className="divide-y">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {member.farmer.name ?? "Farmer"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {member.farmer.phone}
                  </p>
                </div>

                <div className="font-semibold text-green-700">
                  {member.bagsPledged} bags
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            Recent Group Transactions
          </h2>
        </div>

        {group.transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions yet.
          </div>
        ) : (
          <div className="divide-y">
            {group.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between px-6 py-4"
              >
                <div>
                  <p className="font-mono text-xs text-gray-500">
                    {tx.reference}
                  </p>

                  <p className="text-sm">
                    {tx.totalBags} bags
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    KSh {tx.totalValue.toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-500">
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-600"
          disabled
        >
          Join Group (Coming Soon)
        </button>

        <button
          className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-600"
          disabled
        >
          Update Pledge (Coming Soon)
        </button>

        <button
          className="rounded-lg bg-amber-600 px-5 py-3 text-white hover:bg-amber-500"
          disabled
        >
          Confirm Group Sale (Coming Soon)
        </button>
      </div>
    </div>
  );
}