import { Users } from 'lucide-react';

interface Props {
  buyers: any[];
}

export default function TopBuyersList({ buyers }: Props) {
  if (!buyers || buyers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-[400px] flex flex-col items-center justify-center text-center">
        <Users className="w-10 h-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">No buyer data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-[400px] overflow-y-auto">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Top Buyers by Revenue</h3>
      <div className="space-y-3">
        {buyers.map((buyer, i) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-[#00703C] flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{buyer.name}</p>
                <p className="text-xs text-gray-500">{buyer.txs} transactions</p>
              </div>
            </div>
            <p className="text-sm font-bold text-[#00703C]">KSh {buyer.spent.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
