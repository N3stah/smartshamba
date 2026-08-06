'use client';
import { useEffect, useState } from 'react';
import { Loader2, FileText, CheckCircle, Clock, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

export default function ContractAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/contract-analytics')
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;
  if (!data) return <div className="bg-white p-8 text-center text-gray-500 rounded-xl border">Failed to load analytics data.</div>;

  const kpis = data.kpis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="w-6 h-6 text-[#00703C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contract Analytics</h1>
            <p className="text-sm text-gray-500">Executive overview of digital contract performance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Contracts</p>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{kpis.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Completion Rate</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-700">{kpis.completionRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Sign Time</p>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-700">{kpis.avgSignTimeHours}h</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Dispute Rate</p>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-700">{kpis.disputeRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contract Status Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Executed</div>
              <span className="font-bold text-gray-900">{kpis.executed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" /> Draft (Pending)</div>
              <span className="font-bold text-gray-900">{kpis.drafts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Disputed</div>
              <span className="font-bold text-gray-900">{kpis.disputed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-gray-500" /> Voided/Amended</div>
              <span className="font-bold text-gray-900">{kpis.voided}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
