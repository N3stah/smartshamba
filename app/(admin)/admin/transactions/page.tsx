'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface Transaction {
  id: string;
  reference: string;
  status: string;
  quantityBags: number;
  pricePerBag: number;
  totalValue: number;
  mpesaRef: string | null;
  createdAt: string;
  farmer?: { name: string | null; phone: string };
  buyer?: { name: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border border-blue-200',
  SETTLED:   'bg-green-100 text-green-800 border border-green-200',
  DISPUTED:  'bg-red-100 text-red-800 border border-red-200',
  DELIVERED: 'bg-purple-100 text-purple-800 border border-purple-200',
};

type FilterStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'SETTLED' | 'DISPUTED';

function SettleModal({
  tx,
  onClose,
  onSettled,
}: {
  tx: Transaction;
  onClose: () => void;
  onSettled: (id: string, mpesaRef: string) => void;
}) {
  const [mpesaRef, setMpesaRef] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mpesaRef.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch(`/api/admin/transactions/${tx.id}/settle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mpesaRef: mpesaRef.trim(), notifyFarmer: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Settlement failed');
      setLoading(false);
      return;
    }

    onSettled(tx.id, mpesaRef.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Settle Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">×</button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Reference</p>
              <p className="font-mono text-gray-900 font-medium mt-0.5"><Link href={`/admin/transactions/${tx.id}`} className="text-[#00703C] hover:underline">{tx.reference}</Link></p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Amount</p>
              <p className="font-bold text-green-700 mt-0.5">KSh {tx.totalValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Farmer</p>
              <p className="text-gray-900 mt-0.5">{tx.farmer?.name ?? 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Buyer</p>
              <p className="text-gray-900 mt-0.5">{tx.buyer?.name ?? '—'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              M-PESA Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mpesaRef}
              onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
              placeholder="e.g. QK31YZX3HQ"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 uppercase"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the M-PESA confirmation code from Safaricom. The farmer will be notified via SMS.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !mpesaRef.trim()}
              className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? 'Settling...' : 'Confirm settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1,2,3,4,5,6,7].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterStatus>('ALL');
  const [search, setSearch]             = useState('');
  const [settlingTx, setSettlingTx]     = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/transactions');
    if (res.ok) setTransactions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => filter === 'ALL' || tx.status === filter)
      .filter((tx) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          tx.reference.toLowerCase().includes(q) ||
          (tx.farmer?.name ?? '').toLowerCase().includes(q) ||
          (tx.farmer?.phone ?? '').toLowerCase().includes(q) ||
          (tx.buyer?.name ?? '').toLowerCase().includes(q)
        );
      });
  }, [transactions, filter, search]);

  const stats = useMemo(() => ({
    total:    transactions.length,
    pending:  transactions.filter(t => t.status === 'PENDING').length,
    settled:  transactions.filter(t => t.status === 'SETTLED').length,
    volume:   transactions.reduce((s, t) => s + t.totalValue, 0),
  }), [transactions]);

  function handleSettled(id: string, mpesaRef: string) {
    setTransactions(prev =>
      prev.map(tx => tx.id === id ? { ...tx, status: 'SETTLED', mpesaRef } : tx)
    );
  }

  const canSettle = (status: string) => status === 'PENDING' || status === 'CONFIRMED';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">All farmer-buyer transaction records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Settled</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.settled}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-300 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Volume</p>
          <p className="text-xl font-bold text-green-700 mt-1">KSh {stats.volume.toLocaleString()}</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reference, farmer, buyer, or phone..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm shrink-0">
          {(['ALL', 'PENDING', 'CONFIRMED', 'SETTLED', 'DISPUTED'] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2.5 text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            {filter !== 'ALL' && ` · ${filter.charAt(0) + filter.slice(1).toLowerCase()}`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Farmer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && [1,2,3,4,5].map(n => <SkeletonRow key={n} />)}

              {!loading && filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      <Link href={`/admin/transactions/${tx.id}`} className="text-[#00703C] hover:underline">{tx.reference}</Link>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{tx.farmer?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{tx.farmer?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{tx.buyer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{tx.quantityBags}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    KSh {tx.totalValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {tx.status}
                    </span>
                    {tx.mpesaRef && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{tx.mpesaRef}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {canSettle(tx.status) && (
                      <button
                        onClick={() => setSettlingTx(tx)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors whitespace-nowrap"
                      >
                        Settle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">
                {search || filter !== 'ALL' ? 'No transactions match your filter.' : 'No transactions found.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {settlingTx && (
        <SettleModal
          tx={settlingTx}
          onClose={() => setSettlingTx(null)}
          onSettled={handleSettled}
        />
      )}
    </div>
  );
}
