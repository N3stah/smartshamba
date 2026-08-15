'use client';
import { useEffect, useState } from 'react';
import { Loader2, DollarSign } from 'lucide-react';

export default function CFODashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null).then(d => setData(d?.cfo)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const kpis = [
    { label: 'Total Revenue', value: `KSh ${(data?.totalRevenue / 1000).toFixed(1)}K`, sub: 'Platform fees', color: 'text-green-700' },
    { label: 'Revenue (30d)', value: `KSh ${(data?.revenue30d / 1000).toFixed(1)}K`, sub: 'Last 30 days', color: 'text-gray-900' },
    { label: 'Liabilities', value: `KSh ${data?.platformLiabilities.toLocaleString()}`, sub: 'Escrow balance', color: 'text-red-700' },
    { label: 'Pending Payouts', value: data?.pendingWithdrawals, sub: 'Awaiting M-PESA', color: 'text-orange-700' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(k => (
        <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">{k.label}</p><DollarSign className="w-5 h-5 text-gray-400" /></div>
          <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}
