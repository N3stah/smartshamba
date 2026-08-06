'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Wallet, TrendingUp, Scale, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminFinancePage() {
  const [data, setData] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/withdrawals').then(r => r.ok ? r.json() : []).then(setWithdrawals).catch(()=>{});
    fetch('/api/admin/finance')
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;
  if (!data) return <div className="bg-white p-8 text-center text-gray-500 rounded-xl border">Failed to load financial data.</div>;

  const processWithdrawal = async (id: string, action: string) => {
    const mpesaRef = action === 'APPROVE' ? prompt('Enter M-PESA B2C Reference Code:') : null;
    if (action === 'APPROVE' && !mpesaRef) return alert('M-PESA Ref is required');
    
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, mpesaRef })
    });
    // Refresh list
    fetch('/api/admin/withdrawals').then(r => r.ok ? r.json() : []).then(setWithdrawals).catch(()=>{});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Wallet className="w-6 h-6 text-[#00703C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finance & Reconciliation</h1>
            <p className="text-sm text-gray-500">Platform ledger and financial overview</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-green-300 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Platform Revenue (Fees)</p>
            <TrendingUp className="w-5 h-5 text-[#00703C]" />
          </div>
          <p className="text-2xl font-bold text-green-700">KSh {data.kpis.platformRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Liabilities (Owed to Users)</p>
            <Scale className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-700">KSh {data.kpis.totalLiabilities.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Net Position</p>
            <Wallet className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700">KSh {(data.kpis.platformRevenue - data.kpis.totalLiabilities).toLocaleString()}</p>
        </div>
      </div>

      {/* Withdrawal Queue */}
      <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-yellow-50">
          <h2 className="font-semibold text-yellow-900">Withdrawal Queue (Pending Payouts)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">User ID</th>
                <th className="p-4 font-semibold text-gray-600">Amount</th>
                <th className="p-4 font-semibold text-gray-600">Requested</th>
                <th className="p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No pending withdrawals.</td></tr>
              ) : (
                withdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs text-gray-700">{w.userId.substring(0,8)}... ({w.userType})</td>
                    <td className="p-4 font-bold text-red-600">KSh {w.amount.toLocaleString()}</td>
                    <td className="p-4 text-xs text-gray-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 space-x-2">
                      <button onClick={() => processWithdrawal(w.id, 'APPROVE')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">Approve & Pay</button>
                      <button onClick={() => processWithdrawal(w.id, 'REJECT')} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Feed */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Ledger Entries (Audit Trail)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Timestamp</th>
                <th className="p-4 font-semibold text-gray-600">User Type</th>
                <th className="p-4 font-semibold text-gray-600">Description</th>
                <th className="p-4 font-semibold text-gray-600">Type</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentEntries.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="p-4 text-xs text-gray-500">{new Date(e.createdAt).toLocaleString('en-KE')}</td>
                  <td className="p-4 text-xs font-bold uppercase text-gray-700">{e.userType}</td>
                  <td className="p-4 text-sm text-gray-900">{e.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${e.entryType === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {e.entryType}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold ${e.entryType === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    KSh {e.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.recentEntries.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No ledger entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
