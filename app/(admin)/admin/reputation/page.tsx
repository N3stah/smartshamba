'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Loader2, Trophy, Activity } from 'lucide-react';

export default function AdminReputationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reputation')
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;
  if (!data) return <div className="bg-white p-8 text-center text-gray-500 rounded-xl border">Failed to load reputation data.</div>;

  const renderBreakdown = (breakdown: any) => (
    <div className="mt-2 text-xs text-gray-500 space-y-1">
      <p>Verification: {breakdown?.verification || 0}/10 | Vol: {breakdown?.transaction_volume || 0}/20 | Rating: {breakdown?.rating_quality || 0}/20</p>
      <p>Disputes: {breakdown?.dispute_health || 0}/15 | Delivery: {breakdown?.delivery_reliability || 0}/15</p>
      <p>Payment: {breakdown?.payment_reliability || 0}/15 | Activity: {breakdown?.platform_activity || 0}/10</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Shield className="w-6 h-6 text-[#00703C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trust Intelligence Engine</h1>
            <p className="text-sm text-gray-500">Continuous behavioral evaluation & objective metrics</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <Activity className="w-5 h-5 text-blue-600" />
        <p className="text-sm text-blue-800">The engine continuously recalculates scores daily using time-decay logic. Recent activity matters more than historical data.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Rated Farmers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
            <h2 className="font-semibold text-green-900 flex items-center gap-2"><Trophy className="w-4 h-4" /> Top Rated Farmers</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.topFarmers.map((f: any) => (
              <div key={f.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{f.name}</span>
                  <span className="text-sm font-bold text-green-700">{f.score} - {f.level}</span>
                </div>
                {renderBreakdown(f.breakdown)}
              </div>
            ))}
            {data.topFarmers.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">No top rated farmers yet.</p>}
          </div>
        </div>

        {/* Top Rated Buyers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
            <h2 className="font-semibold text-blue-900 flex items-center gap-2"><Trophy className="w-4 h-4" /> Top Rated Buyers</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.topBuyers.map((b: any) => (
              <div key={b.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{b.name}</span>
                  <span className="text-sm font-bold text-blue-700">{b.score} - {b.level}</span>
                </div>
                {renderBreakdown(b.breakdown)}
              </div>
            ))}
            {data.topBuyers.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">No top rated buyers yet.</p>}
          </div>
        </div>
      </div>

      {/* Suspicious Accounts */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
          <h2 className="font-semibold text-red-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Suspicious Accounts (Score &lt; 40)</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {data.suspiciousAccounts.map((s: any) => (
            <div key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-gray-500">{s.userId.substring(0, 12)}...</p>
                <p className="text-xs text-gray-400">{s.userType}</p>
              </div>
              <span className="text-sm font-bold text-red-600">{s.score} - {s.level}</span>
            </div>
          ))}
          {data.suspiciousAccounts.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">No suspicious accounts detected. 🎉</p>}
        </div>
      </div>
    </div>
  );
}
