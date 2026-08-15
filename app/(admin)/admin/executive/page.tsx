'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, TrendingUp, Users, DollarSign, Activity, ShieldCheck, Brain, AlertTriangle, Download, Truck, FileText, Sparkles, CloudRain } from 'lucide-react';

interface ExecutiveData {
  growth: {
    totalFarmers: number;
    newFarmers30d: number;
    totalBuyers: number;
    newBuyers30d: number;
  };
  intelligence: {
    aiPredictionsGenerated: number;
    weatherAlertsSent30d: number;
  };
  operations: {
    successRate: number;
    disputeRate: number;
    activeTransportJobs: number;
    transportSuccessRate: number;
    activeContracts: number;
    transactions30d: number;
    totalTransactions: number;
  };
  financials: {
    totalRevenue: number;
    revenueGrowth: number;
    revenue30d: number;
    platformLiabilities: number;
    pendingWithdrawals: number;
  };
}

interface Alert {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
}

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [aiBrief, setAiBrief] = useState<string>('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'CEO' | 'COO' | 'CFO'>('CEO');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null),
      fetch('/api/ai/executive-insights').then(r => r.ok ? r.json() : null),
      fetch('/api/admin/alerts').then(r => r.ok ? r.json() : [])
    ])
      .then(([biData, aiData, alertData]) => {
        setData(biData);
        setAiBrief(aiData?.summary || 'AI summary unavailable.');
        setAlerts(alertData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;
  if (!data) return <div className="bg-white p-8 text-center text-gray-500 rounded-xl border">Failed to load executive data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-[#00703C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Command Center</h1>
            <p className="text-sm text-gray-500">Enterprise business intelligence & operational health</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/executive-bi/export" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Download className="w-4 h-4" /> Export Data
          </a>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      {/* AI Brief & Alert Center */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-linear-to-br from-[#00703C] to-[#004d29] rounded-xl shadow-lg p-6 text-white flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">AI Executive Brief</h2>
          </div>
          <p className="text-sm italic">&ldquo;{aiBrief}&rdquo;</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Alert Center</h3>
          {alerts.length === 0 ? <p className="text-xs text-gray-400">No active alerts. 🎉</p> : 
            alerts.map((a, i) => (
              <div key={i} className={`p-2 rounded-lg text-xs ${a.level === 'HIGH' ? 'bg-red-50 text-red-700' : a.level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-600'} border ${a.level === 'HIGH' ? 'border-red-100' : a.level === 'MEDIUM' ? 'border-yellow-100' : 'border-gray-100'}`}>
                <p className="font-bold">{a.title}</p>
                <p>{a.message}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['CEO', 'COO', 'CFO'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? 'text-[#00703C] border-b-2 border-[#00703C]' : 'text-gray-500'}`}>{t} View</button>
        ))}
      </div>

      {/* CEO View */}
      {tab === 'CEO' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Total Farmers</p><Users className="w-5 h-5 text-blue-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.growth.totalFarmers}</p>
            <p className="text-xs text-gray-400 mt-1">+{data.growth.newFarmers30d} new (30d)</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Total Buyers</p><Users className="w-5 h-5 text-purple-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.growth.totalBuyers}</p>
            <p className="text-xs text-gray-400 mt-1">+{data.growth.newBuyers30d} new (30d)</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">AI Predictions</p><Brain className="w-5 h-5 text-green-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.intelligence.aiPredictionsGenerated}</p>
            <p className="text-xs text-gray-400 mt-1">Market models generated</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Weather Alerts</p><CloudRain className="w-5 h-5 text-blue-400" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.intelligence.weatherAlertsSent30d}</p>
            <p className="text-xs text-gray-400 mt-1">Sent to farmers (30d)</p>
          </div>
        </div>
      )}

      {/* COO View */}
      {tab === 'COO' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Tx Success Rate</p><Activity className="w-5 h-5 text-green-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.operations.successRate}%</p>
            <p className="text-xs text-gray-400 mt-1">{data.operations.disputeRate}% dispute rate</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Active Transport</p><Truck className="w-5 h-5 text-orange-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.operations.activeTransportJobs}</p>
            <p className="text-xs text-gray-400 mt-1">{data.operations.transportSuccessRate}% success rate</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Active Contracts</p><FileText className="w-5 h-5 text-blue-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.operations.activeContracts}</p>
            <p className="text-xs text-gray-400 mt-1">Legally executed</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Tx Volume (30d)</p><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.operations.transactions30d}</p>
            <p className="text-xs text-gray-400 mt-1">Out of {data.operations.totalTransactions} total</p>
          </div>
        </div>
      )}

      {/* CFO View */}
      {tab === 'CFO' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-green-300 p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Total Revenue</p><DollarSign className="w-5 h-5 text-green-600" /></div>
            <p className="text-2xl font-bold text-green-700">KSh {(data.financials.totalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-gray-400 mt-1">{data.financials.revenueGrowth}% growth (30d)</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Revenue (30d)</p><DollarSign className="w-5 h-5 text-green-600" /></div>
            <p className="text-2xl font-bold text-gray-900">KSh {(data.financials.revenue30d / 1000).toFixed(1)}K</p>
            <p className="text-xs text-gray-400 mt-1">Platform fees collected</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Liabilities (Escrow)</p><DollarSign className="w-5 h-5 text-red-600" /></div>
            <p className="text-2xl font-bold text-red-700">KSh {data.financials.platformLiabilities.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Owed to users</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2"><p className="text-xs text-gray-500 uppercase">Pending Payouts</p><DollarSign className="w-5 h-5 text-orange-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{data.financials.pendingWithdrawals}</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting processing</p>
          </div>
        </div>
      )}
    </div>
  );
}
