'use client';
import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function RiskDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null).then(d => setData(d?.risk)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const kpis = [
    { label: 'Verified Farmers', value: data?.verifiedFarmers, icon: ShieldCheck },
    { label: 'Verified Buyers', value: data?.verifiedBuyers, icon: ShieldCheck },
    { label: 'Platinum Users', value: data?.platinumUsers, icon: ShieldCheck },
    { label: 'Suspicious Accounts', value: data?.suspiciousAccounts, icon: AlertTriangle },
    { label: 'Active Disputes', value: data?.disputedTx, icon: AlertTriangle }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map(k => (
        <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">{k.label}</p><k.icon className={`w-5 h-5 ${k.label.includes('Suspicious') || k.label.includes('Disputes') ? 'text-red-500' : 'text-[#00703C]'}`} /></div>
          <p className="text-2xl font-bold text-gray-900">{k.value}</p>
        </div>
      ))}
    </div>
  );
}
