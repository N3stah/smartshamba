import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function FarmerTransactionsPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const farmer = await prisma.farmer.findUnique({ where: { phone } });
  if (!farmer) redirect('/dashboard/login');

  const transactions = await prisma.transaction.findMany({
    where: { farmerId: farmer.id },
    orderBy: { createdAt: 'desc' },
    include: { buyer: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">{transactions.length} total records</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="font-mono text-xs text-[#00703C] bg-green-50 px-2 py-1 rounded hover:underline">
                      {tx.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{tx.buyer.name}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{tx.quantityBags}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    KSh {tx.totalValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="text-xs font-semibold text-white bg-[#00703C] px-3 py-1.5 rounded-lg hover:bg-green-800 inline-block">
                      View & Chat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">
              No transactions yet. Dial *384*53374# to start selling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
