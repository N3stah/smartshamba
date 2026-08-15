'use client';
import { useEffect, useState } from 'react';
import { Loader2, Users, Package } from 'lucide-react';

export default function GrowthDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null).then(d => setData(d?.growth)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const kpis = [
    { label: 'New Farmers (30d)', value: data?.newFarmers30d, icon: Users },
    { label: 'New Buyers (30d)', value: data?.newBuyers30d, icon: Users },
    { label: 'Active Listings', value: data?.activeListings, icon: Package },
    { label: 'Active Demands', value: data?.activeDemands, icon: Package }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(k => (
        <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">{k.label}</p><k.icon className="w-5 h-5 text-[#00703C]" /></div>
          <p className="text-2xl font-bold text-gray-900">{k.value}</p>
        </div>
      ))}
    </div>
  );
}
