import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DemandModerationButton from '@/components/admin/DemandModerationButton';
import StatusBadge from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AdminDemandsPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  const demands = await prisma.buyerDemand.findMany({
    include: { buyer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buyer Demands (Moderation)</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-600">Product</th>
                <th className="text-left p-4 font-semibold text-gray-600">Buyer</th>
                <th className="text-left p-4 font-semibold text-gray-600">Qty (Bags)</th>
                <th className="text-left p-4 font-semibold text-gray-600">Location</th>
                <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                <th className="text-left p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demands.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{d.product}</td>
                  <td className="p-4 text-gray-600">{d.buyer.name}<br/><span className="text-xs text-gray-400">{d.buyer.phone ?? 'N/A'}</span></td>
                  <td className="p-4 text-gray-600">{d.quantityBags}</td>
                  <td className="p-4 text-gray-600">{d.location}</td>
                  <td className="p-4"><StatusBadge status={d.status} /></td>
                  <td className="p-4">
                    <DemandModerationButton id={d.id} currentStatus={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {demands.length === 0 && <div className="p-8 text-center text-gray-400">No demands found.</div>}
        </div>
      </div>
    </div>
  );
}
