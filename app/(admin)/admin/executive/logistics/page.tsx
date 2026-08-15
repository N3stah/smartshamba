'use client';
import { useEffect, useState } from 'react';
import { Loader2, Truck } from 'lucide-react';

export default function LogisticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null).then(d => setData(d?.logistics)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const kpis = [
    { label: 'Active Jobs', value: data?.activeJobs },
    { label: 'Completed Jobs', value: data?.completedJobs },
    { label: 'Success Rate', value: `${data?.successRate}%` }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpis.map(k => (
        <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">{k.label}</p><Truck className="w-5 h-5 text-orange-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{k.value}</p>
        </div>
      ))}
    </div>
  );
}
