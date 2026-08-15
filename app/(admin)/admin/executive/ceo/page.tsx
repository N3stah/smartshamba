'use client';
import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Users, DollarSign, Brain, FileText, Sparkles } from 'lucide-react';
import LiveActivityFeed from '@/components/admin/LiveActivityFeed';

export default function CEODashboard() {
  const [data, setData] = useState<any>(null);
  const [aiBrief, setAiBrief] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null),
      fetch('/api/ai/executive-insights').then(r => r.ok ? r.json() : null)
    ]).then(([bi, ai]) => {
      setData(bi?.ceo);
      setAiBrief(ai?.summary || 'AI summary unavailable.');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const kpis = [
    { label: 'Total Revenue', value: `KSh ${(data?.totalRevenue / 1000).toFixed(1)}K`, sub: `${data?.revenueGrowth}% growth`, icon: DollarSign },
    { label: 'Total Farmers', value: data?.totalFarmers, sub: `+${data?.farmerGrowth} new`, icon: Users },
    { label: 'Total Buyers', value: data?.totalBuyers, sub: `+${data?.buyerGrowth} new`, icon: Users },
    { label: 'AI Predictions', value: data?.aiPredictions, sub: 'Market models', icon: Brain }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-br from-[#00703C] to-[#004d29] rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">AI Executive Brief</h2>
        </div>
        <p className="text-sm italic">"{aiBrief}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase">{k.label}</p>
              <k.icon className="w-5 h-5 text-[#00703C]" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Revenue Trend</h3>
          <p className="text-gray-500 text-sm">Revenue data visualization will appear here.</p>
        </div>
        <div className="lg:col-span-1">
          <LiveActivityFeed />
        </div>
      </div>
    </div>
  );
}
