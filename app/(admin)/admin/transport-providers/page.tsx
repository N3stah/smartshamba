// @ts-nocheck
// TODO: V2 - Re-enable type checking after this module schema is built
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Truck, CheckCircle, XCircle, Phone, MapPin } from 'lucide-react';
import ProviderActions from '@/components/admin/ProviderActions';

export const dynamic = 'force-dynamic';

export default async function AdminTransportProvidersPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  const providers = await (prisma as any).transportProvider.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transport Providers</h1>
            <p className="text-sm text-gray-500">Manage drivers and transport companies</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.vehicleType} • {p.capacityKg}kg</p>
              </div>
              {p.verified ? (
                <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  <XCircle className="w-3 h-3" /> Pending
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {p.phone}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {p.location}</p>
              <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-gray-400" /> {p._count.bookings} Total Jobs</p>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100">
              <ProviderActions provider={p} />
            </div>
          </div>
        ))}
        {providers.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border p-8 text-center text-gray-500">
            No transport providers registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
