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

async function getTransactions(): Promise<Transaction[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/transactions`, {
    cache: 'no-store',
    headers: { 'x-admin-key': process.env.ADMIN_API_KEY ?? '' },
  });
  if (!res.ok) return [];
  return res.json();
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border border-blue-200',
  SETTLED:   'bg-green-100 text-green-800 border border-green-200',
  DISPUTED:  'bg-red-100 text-red-800 border border-red-200',
  DELIVERED: 'bg-purple-100 text-purple-800 border border-purple-200',
};

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  const totalValue = transactions.reduce((sum, tx) => sum + tx.totalValue, 0);
  const settled = transactions.filter(tx => tx.status === 'SETTLED').length;
  const pending = transactions.filter(tx => tx.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">
          All farmer-buyer transaction records
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Settled</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{settled}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-300 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Volume</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            KSh {totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            All Transactions ({transactions.length})
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {tx.reference}
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
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No transactions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
