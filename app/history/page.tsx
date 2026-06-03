import { Transaction } from '@/types/transaction';

async function getTransactions(): Promise<Transaction[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/transactions`, {
    cache: 'no-store',
    headers: {
      'x-admin-key': process.env.ADMIN_API_KEY ?? '',
    },
  });

  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING:   'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    DELIVERED: 'bg-purple-100 text-purple-700',
    SETTLED:   'bg-green-100 text-green-700',
    DISPUTED:  'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function HistoryPage() {
  const transactions = await getTransactions();

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-green-800">
            Farmer Transactions
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            Live transaction records for maize delivery coordination in Trans Nzoia County.
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="grid gap-6">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">
                      {tx.reference}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(tx.createdAt as unknown as string)}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium w-fit ${statusBadge(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Farmer</p>
                    <p className="font-semibold mt-1">
                      👨‍🌾 {tx.farmer?.name ?? tx.farmerId}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Buyer</p>
                    <p className="font-semibold mt-1">
                      🏢 {tx.buyer?.name ?? tx.buyerId}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-semibold mt-1">
                      🌽 {tx.quantityBags} bags
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="font-semibold mt-1 text-green-700">
                      💰 KSh {tx.totalValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
