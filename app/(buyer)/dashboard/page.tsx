import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function BuyerDashboard() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ 
    where: { phone },
    include: { 
      transactions: { 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        include: { farmer: true }
      } 
    }
  });

  if (!buyer) redirect('/buyer/login');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {buyer.name}</h1>
      <p className="text-gray-500 text-sm mt-1">Manage your buying offers and transactions</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Current Offer</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">KSh {buyer.pricePerBag}/bag</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Capacity</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{buyer.capacityBags} bags</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">Location</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{buyer.location}</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {buyer.transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No transactions yet.</div>
          ) : (
            buyer.transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-gray-600">{tx.reference}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{tx.farmer.name ?? 'Farmer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{tx.quantityBags} bags</p>
                  <p className="text-xs text-gray-400">KSh {tx.totalValue.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
