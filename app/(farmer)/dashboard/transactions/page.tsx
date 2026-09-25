export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function FarmerTransactionsPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const farmer = await prisma.farmer.findUnique({ where: { phone } });
  if (!farmer) redirect('/dashboard/login');

  const transactions = await prisma.transaction.findMany({
    where: { farmerId: farmer.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { buyer: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">My Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">Showing latest {transactions.length} records</p>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="font-mono text-xs text-farmer-primary bg-farmer-secondary px-2 py-1 rounded hover:underline">
                      {tx.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text font-medium">{tx.buyer.name}</td>
                  <td className="px-4 py-3 text-right text-text">{tx.quantityBags}</td>
                  <td className="px-4 py-3 text-right font-semibold text-text">
                    KSh {tx.totalValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/transactions/${tx.id}`}>
                      <Button size="sm" variant="outline">View & Chat</Button>
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
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {transactions.map((tx) => (
          <Card key={tx.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-mono text-xs text-gray-500">{tx.reference}</p>
                <p className="font-semibold text-text mt-1">{tx.buyer.name}</p>
              </div>
              <StatusBadge status={tx.status} />
            </div>
            <div className="flex justify-between items-center text-sm border-t border-border pt-3">
              <span className="text-gray-500">{tx.quantityBags} bags</span>
              <span className="font-bold text-text">KSh {tx.totalValue.toLocaleString()}</span>
            </div>
            <Link href={`/dashboard/transactions/${tx.id}`} className="block mt-4">
              <Button size="sm" variant="outline" className="w-full">View Details & Chat</Button>
            </Link>
          </Card>
        ))}
        {transactions.length === 0 && (
          <Card className="py-16 text-center text-gray-400 text-sm">
            No transactions yet. Dial *384*53374# to start selling.
          </Card>
        )}
      </div>
    </div>
  );
}
