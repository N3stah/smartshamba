import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminGroupDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const group = await prisma.farmerGroup.findUnique({
    where: {
      id,
    },
    include: {
      county: true,
      ward: true,
      createdBy: true,

      members: {
        include: {
          farmer: true,
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

  const totalSales = group.transactions.reduce(
    (sum, tx) => sum + tx.totalValue,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {group.name}
          </h1>

          <p className="mt-2 text-gray-500">
            {group.description ?? "No description"}
          </p>
        </div>

        <Link
          href="/admin/groups"
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          ← Back to Groups
        </Link>
      </div>

      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Members
          </p>

          <p className="mt-2 text-3xl font-bold">
            {group.members.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Bags Pledged
          </p>

          <p className="mt-2 text-3xl font-bold text-green-700">
            {totalBags}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Transactions
          </p>

          <p className="mt-2 text-3xl font-bold">
            {group.transactions.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Sales Value
          </p>

          <p className="mt-2 text-3xl font-bold text-green-700">
            KSh {totalSales.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Group Information */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Group Information
          </h2>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Created By
            </p>

            <p className="font-medium">
              {group.createdBy?.name ?? "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Created On
            </p>

            <p className="font-medium">
              {new Date(group.createdAt).toLocaleDateString(
                "en-KE"
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              County
            </p>

            <p className="font-medium">
              {group.county?.name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Ward
            </p>

            <p className="font-medium">
              {group.ward?.name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Village
            </p>

            <p className="font-medium">
              {group.village ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Group Members
          </h2>
        </div>

        {group.members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No members found.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  Farmer
                </th>

                <th className="px-6 py-3 text-left">
                  Phone
                </th>

                <th className="px-6 py-3 text-center">
                  Bags Pledged
                </th>

                <th className="px-6 py-3 text-center">
                  Joined
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {group.members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 font-medium">
                    {member.farmer.name ?? "Unnamed Farmer"}
                  </td>

                  <td className="px-6 py-4">
                    {member.farmer.phone}
                  </td>

                  <td className="px-6 py-4 text-center font-semibold text-green-700">
                    {member.bagsPledged}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {new Date(
                      member.joinedAt
                    ).toLocaleDateString("en-KE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transactions */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Group Transactions
          </h2>
        </div>

        {group.transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions recorded.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  Reference
                </th>

                <th className="px-6 py-3 text-center">
                  Bags
                </th>

                <th className="px-6 py-3 text-right">
                  Value
                </th>

                <th className="px-6 py-3 text-center">
                  Status
                </th>

                <th className="px-6 py-3 text-center">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {group.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 font-mono">
                    {tx.reference}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {tx.totalBags}
                  </td>

                  <td className="px-6 py-4 text-right font-semibold">
                    KSh {tx.totalValue.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      {tx.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {new Date(
                      tx.createdAt
                    ).toLocaleDateString("en-KE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}