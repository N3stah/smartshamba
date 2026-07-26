import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function BuyerNotifications() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone } });
  if (!buyer) redirect('/buyer/login');

  const notifications = await prisma.notification.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-4 flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">{n.type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-600">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-KE')}</p>
                </div>
                <StatusBadge status={n.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
