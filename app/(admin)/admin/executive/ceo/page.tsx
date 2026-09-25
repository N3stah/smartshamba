'use client';
import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Users, Brain, FileText, Sparkles, Activity, ArrowRight, Target } from 'lucide-react';
import Link from 'next/link';

interface CEOData {
  totalRevenue: number;
  revenueGrowth: number;
  totalFarmers: number;
  totalBuyers: number;
  farmerGrowth: number;
  buyerGrowth: number;
  aiPredictions: number;
  activeContracts: number;
}

interface AgIntelData {
  supplyByCrop: { crop: string; bags: number }[];
  demandByCrop: { crop: string; bags: number }[];
}

export default function CEODashboard() {
  const [ceo, setCeo] = useState<CEOData | null>(null);
  const [agintel, setAgintel] = useState<AgIntelData | null>(null);
  const [aiBrief, setAiBrief] = useState('Loading AI insights...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null),
      fetch('/api/ai/executive-insights').then(r => r.ok ? r.json() : null)
    ]).then(([bi, ai]) => {
      if (bi) {
        setCeo(bi.ceo);
        setAgintel(bi.agintel);
      }
      if (ai) setAiBrief(ai.summary || 'AI summary unavailable.');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-admin-primary" /></div>;

  const kpis = [
    { label: 'Total Revenue', value: `KSh ${(ceo?.totalRevenue || 0).toLocaleString()}`, sub: `${ceo?.revenueGrowth || 0}% growth (30d)`, icon: TrendingUp },
    { label: 'Total Farmers', value: ceo?.totalFarmers || 0, sub: `+${ceo?.farmerGrowth || 0} new (30d)`, icon: Users },
    { label: 'Total Buyers', value: ceo?.totalBuyers || 0, sub: `+${ceo?.buyerGrowth || 0} new (30d)`, icon: Users },
    { label: 'Active Contracts', value: ceo?.activeContracts || 0, sub: 'Legally executed', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* AI Executive Brief & Strategic Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">AI Executive Brief</h2>
          </div>
          <p className="text-sm italic text-gray-300">&ldquo;{aiBrief}&rdquo;</p>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Strategic Vision</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• Expand to 5 new counties in Rift Valley</p>
            <p>• Onboard 1,000 active farmers by Q4</p>
            <p>• Secure 3 strategic buyer partnerships</p>
          </div>
        </div>
      </div>

      {/* Growth & Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase">{k.label}</p>
              <k.icon className="w-5 h-5 text-admin-primary" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Market Health & AI Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Market Health (Supply vs Demand)</h3>
          <div className="space-y-4">
            {agintel?.supplyByCrop.map((s, i) => {
              const demand = agintel.demandByCrop.find(d => d.crop === s.crop);
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{s.crop}</span>
                    <span className="text-gray-500">Supply: {s.bags} bags / Demand: {demand?.bags || 0} bags</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (s.bags / (demand?.bags || s.bags || 1)) * 100)}%` }}></div>
                  </div>
                </div>
              );
            })}
            {(!agintel || agintel.supplyByCrop.length === 0) && <p className="text-sm text-gray-500">No active supply data.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-purple-600" /> AI Market Intelligence</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Predictions Generated</p>
                <p className="text-xs text-gray-500">Market models active</p>
              </div>
              <p className="text-xl font-bold text-purple-700">{ceo?.aiPredictions || 0}</p>
            </div>
            <Link href="/admin/ai-dashboard" className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">View AI Dashboard</span>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
