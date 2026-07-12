type Props = {
  totalGroups: number;
  totalMembers: number;
  totalBags: number;
};

export default function GroupStats({
  totalGroups,
  totalMembers,
  totalBags,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Nearby Groups
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {totalGroups}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Farmers
        </p>
        <p className="text-3xl font-bold text-green-700 mt-2">
          {totalMembers}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Bags Pledged
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {totalBags}
        </p>
      </div>
    </div>
  );
}