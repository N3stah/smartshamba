'use client';
import { useEffect, useState } from 'react';
import { Loader2, ArrowDownCircle, ArrowUpCircle, Wallet, Download } from 'lucide-react';

interface Entry {
  id: string;
  entryType: string;
  amount: number;
  description: string;
  reference: string | null;
  createdAt: string;
}

export default function WalletStatement({ role }: { role: 'FARMER' | 'BUYER' }) {
  const [data, setData] = useState<{ balance: number; entries: Entry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  useEffect(() => {
    const endpoint = role === 'FARMER' ? '/api/farmers/me/wallet' : '/api/buyers/me/wallet';
    fetch(endpoint)
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [role]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawMsg('');
    try {
      const res = await fetch('/api/farmers/me/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
      });
      const resData = await res.json();
      if (res.ok) {
        setWithdrawMsg('Withdrawal request submitted! Admin will process it shortly.');
        setWithdrawAmount('');
        setShowWithdraw(false);
        // Refresh data
        fetch('/api/farmers/me/wallet').then(r => r.json()).then(setData);
      } else {
        throw new Error(resData.error || 'Failed to request withdrawal');
      }
    } catch (err: any) {
      setWithdrawMsg(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;
  if (!data) return <div className="bg-white p-8 text-center text-gray-500 rounded-xl border">Failed to load wallet data.</div>;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#00703C] to-[#004d29] rounded-xl shadow-lg p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5" />
            <p className="text-sm font-medium uppercase tracking-wider">Available Balance</p>
          </div>
          <p className="text-4xl font-bold">KSh {data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        {role === 'FARMER' && data.balance > 0 && (
          <a 
            href={role === 'FARMER' ? '/api/farmers/me/wallet/export' : '/api/buyers/me/wallet/export'}
            className="mt-4 md:mt-0 bg-transparent border border-white text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/10 flex items-center gap-2 mr-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
        )}
        {role === 'FARMER' && data.balance > 0 && (
          <button 
            onClick={() => setShowWithdraw(!showWithdraw)}
            className="mt-4 md:mt-0 bg-white text-[#00703C] px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Withdraw to M-PESA
          </button>
        )}
      </div>

      {/* Withdrawal Form */}
      {showWithdraw && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Request Withdrawal</h3>
          <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-2">
            <input
              type="number"
              required
              min="1"
              max={data.balance}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Max: KSh ${data.balance.toLocaleString()}`}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900"
            />
            <button type="submit" disabled={withdrawLoading} className="bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00582f] disabled:opacity-50">
              {withdrawLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
          {withdrawMsg && <p className="text-sm text-gray-600 mt-2">{withdrawMsg}</p>}
        </div>
      )}

      {/* Statement Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Date</th>
                <th className="p-4 font-semibold text-gray-600">Description</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Debit (KSh)</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Credit (KSh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.entries.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No transactions yet.</td></tr>
              ) : (
                data.entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {e.entryType === 'CREDIT' ? <ArrowDownCircle className="w-4 h-4 text-green-500" /> : <ArrowUpCircle className="w-4 h-4 text-red-500" />}
                        <div>
                          <p className="font-medium text-gray-900">{e.description}</p>
                          {e.reference && <p className="text-xs text-gray-400 font-mono">{e.reference}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right text-red-600">
                      {e.entryType === 'DEBIT' ? e.amount.toLocaleString() : '-'}
                    </td>
                    <td className="p-4 text-right text-green-600">
                      {e.entryType === 'CREDIT' ? e.amount.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
