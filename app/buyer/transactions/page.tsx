import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function BuyerTransactions() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone } });
  if (!buyer) redirect('/buyer/login');

  // Added take: 50 for pagination
  const transactions = await prisma.transaction.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { farmer: true },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
        <a href="/api/buyers/export/transactions" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600">Export to CSV</a>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Reference</th>
                <th className="p-4 font-semibold text-gray-600">Farmer</th>
                <th className="p-4 font-semibold text-gray-600">Bags</th>
                <th className="p-4 font-semibold text-gray-600">Total Value</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No transactions yet.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <Link href={`/buyer/transactions/${tx.id}`} className="font-mono text-xs text-[#00703C] bg-green-50 px-2 py-1 rounded hover:underline">
                        {tx.reference}
                      </Link>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{tx.farmer.name ?? 'Unknown Farmer'}</td>
                    <td className="p-4 text-gray-600">{tx.quantityBags}</td>
                    <td className="p-4 text-gray-900 font-medium">KSh {tx.totalValue.toLocaleString()}</td>
                    <td className="p-4"><StatusBadge status={tx.status} /></td>
                    <td className="p-4">
                      <Link href={`/buyer/transactions/${tx.id}`} className="text-xs font-semibold text-white bg-[#00703C] px-3 py-1.5 rounded-lg hover:bg-green-800 inline-block">
                        View & Chat
                      </Link>
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
