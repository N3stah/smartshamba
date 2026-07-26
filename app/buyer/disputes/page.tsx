import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function BuyerDisputes() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone } });
  if (!buyer) redirect('/buyer/login');

  const disputes = await prisma.dispute.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    include: { transaction: true, farmer: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Disputes</h1>
      <div className="space-y-4">
        {disputes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
            No disputes filed.
          </div>
        ) : (
          disputes.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex justify-between items-start">
              <div>
                <p className="font-mono text-xs text-gray-500 mb-1">{d.transaction.reference}</p>
                <p className="font-semibold text-gray-900">{d.reason.replace(/_/g, ' ')}</p>
                <p className="text-sm text-gray-600 mt-1">Farmer: {d.farmer.name ?? 'Unknown'}</p>
                {d.description && <p className="text-sm text-gray-500 mt-2 italic">"{d.description}"</p>}
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
