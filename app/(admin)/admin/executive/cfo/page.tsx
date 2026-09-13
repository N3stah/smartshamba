'use client';
import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Activity, ShieldCheck, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CFOData {
  totalRevenue: number;
  revenue30d: number;
  platformLiabilities: number;
  pendingWithdrawals: number;
  successRate: number;
  disputeRate: number;
  activeContracts: number;
  txVolume30d: number;
}

export default function CFODashboard() {
  const [data, setData] = useState<CFOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi')
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d?.cfo))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;
  if (!data) return <div className="bg-white p-8 text-center text-gray-500 rounded-xl border">Failed to load financial data.</div>;

  const kpis = [
    { label: 'Total Revenue', value: `KSh ${(data.totalRevenue || 0).toLocaleString()}`, sub: 'Platform fees collected', icon: TrendingUp, color: 'text-green-700' },
    { label: 'Revenue (30d)', value: `KSh ${(data.revenue30d || 0).toLocaleString()}`, sub: 'Last 30 days', icon: DollarSign, color: 'text-green-700' },
    { label: 'Liabilities (Escrow)', value: `KSh ${(data.platformLiabilities || 0).toLocaleString()}`, sub: 'Owed to users', icon: AlertTriangle, color: 'text-red-700' },
    { label: 'Tx Volume (30d)', value: data.txVolume30d || 0, sub: 'Transactions processed', icon: Activity, color: 'text-blue-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase">{k.label}</p>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Operational Health & Actionable Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" /> Operational Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Transaction Success Rate</span>
                <span className="font-bold text-gray-900">{data.successRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${data.successRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Dispute Rate</span>
                <span className="font-bold text-gray-900">{data.disputeRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${data.disputeRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-orange-600" /> Pending Payouts</h3>
          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Awaiting Processing</p>
              <p className="text-xs text-gray-500">Withdrawal requests pending</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">{data.pendingWithdrawals || 0}</p>
          </div>
          <Link href="/admin/finance" className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-sm font-medium text-gray-700">Process Payouts</span>
            <ArrowRight className="w-4 h-4 text-gray-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}
