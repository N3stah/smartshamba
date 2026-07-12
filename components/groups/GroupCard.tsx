import Link from "next/link";

export type Group = {
  id: string;
  name: string;
  description: string | null;
  village: string | null;

  county: {
    name: string;
  } | null;

  ward: {
    name: string;
  } | null;

  memberCount: number;
  totalBagsPledged: number;
};

type Props = {
  group: Group;
};

export default function GroupCard({ group }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {group.name}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {group.description ?? "No description"}
          </p>
        </div>

        <Link
          href={`/dashboard/groups/${group.id}`}
          className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          View
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
        <div>
          <p className="text-gray-400">Members</p>
          <p className="font-semibold">
            {group.memberCount}
          </p>
        </div>

        <div>
          <p className="text-gray-400">
            Bags Pledged
          </p>

          <p className="font-semibold">
            {group.totalBagsPledged}
          </p>
        </div>

        <div>
          <p className="text-gray-400">
            Ward
          </p>

          <p className="font-semibold">
            {group.ward?.name ?? "Unknown"}
          </p>
        </div>

        <div>
          <p className="text-gray-400">
            County
          </p>

          <p className="font-semibold">
            {group.county?.name ?? "Unknown"}
          </p>
        </div>
      </div>

      {group.village && (
        <div className="mt-5 text-xs text-gray-500">
          Village: {group.village}
        </div>
      )}
    </div>
  );
}