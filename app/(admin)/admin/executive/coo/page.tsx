'use client';
import { useEffect, useState } from 'react';
import { Loader2, Activity, Truck, FileText, TrendingUp } from 'lucide-react';

export default function COODashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null).then(d => setData(d?.coo)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const kpis = [
    { label: 'Success Rate', value: `${data?.successRate}%`, sub: 'Transaction health', icon: Activity },
    { label: 'Active Transport', value: data?.activeTransport, sub: `${data?.transportSuccessRate}% success`, icon: Truck },
    { label: 'Active Contracts', value: data?.activeContracts, sub: 'Legally executed', icon: FileText },
    { label: 'Tx Volume (30d)', value: data?.txVolume30d, sub: 'Marketplace activity', icon: TrendingUp }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(k => (
        <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">{k.label}</p><k.icon className="w-5 h-5 text-[#00703C]" /></div>
          <p className="text-2xl font-bold text-gray-900">{k.value}</p>
          <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}
