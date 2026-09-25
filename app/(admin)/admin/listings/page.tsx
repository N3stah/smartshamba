export const dynamic = 'force-dynamic';

import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ListingModerationButton from '@/components/admin/ListingModerationButton';
import StatusBadge from '@/components/ui/StatusBadge';


export default async function AdminListingsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const listings = await prisma.produceListing.findMany({
    include: { farmer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Produce Listings (Moderation)</h1>
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-600">Product</th>
                <th className="text-left p-4 font-semibold text-gray-600">Farmer</th>
                <th className="text-left p-4 font-semibold text-gray-600">Qty (Bags)</th>
                <th className="text-left p-4 font-semibold text-gray-600">Price/Bag</th>
                <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                <th className="text-left p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{l.product}</td>
                  <td className="p-4 text-gray-600">{l.farmer.name ?? 'Unknown'}<br/><span className="text-xs text-gray-400">{l.farmer.phone}</span></td>
                  <td className="p-4 text-gray-600">{l.quantityBags}</td>
                  <td className="p-4 text-gray-900 font-medium">KSh {l.pricePerBag.toLocaleString()}</td>
                  <td className="p-4"><StatusBadge status={l.status} /></td>
                  <td className="p-4">
                    <ListingModerationButton id={l.id} currentStatus={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length === 0 && <div className="p-8 text-center text-gray-400">No listings found.</div>}
        </div>
      </div>
    </div>
  );
}
