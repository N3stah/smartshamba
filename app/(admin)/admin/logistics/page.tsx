// @ts-nocheck
// TODO: V2 - Re-enable type checking after this module schema is built
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Truck, MapPin, Package, CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLogisticsPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  const bookings = await (prisma as any).transportBooking.findMany({
    include: {
      provider: true,
      transaction: { include: { farmer: true, buyer: true } },
      groupTransaction: { include: { group: true, buyer: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => ['PENDING', 'ACCEPTED', 'LOADED', 'IN_TRANSIT'].includes(b.status)).length,
    delivered: bookings.filter(b => b.status === 'DELIVERED').length,
    revenue: bookings.filter(b => b.status === 'DELIVERED').reduce((sum, b) => sum + b.cost, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logistics Operations</h1>
            <p className="text-sm text-gray-500">Monitor all transport bookings and deliveries</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Bookings</p>
            <Truck className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Delivered</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-300 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Revenue</p>
            <DollarSign className="w-5 h-5 text-[#00703C]" />
          </div>
          <p className="text-2xl font-bold text-green-700">KSh {stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Transport Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Provider</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Cost</th>
                <th className="p-4 font-semibold text-gray-600">Route</th>
                <th className="p-4 font-semibold text-gray-600">Transaction</th>
                <th className="p-4 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{b.provider.name}</p>
                    <p className="text-xs text-gray-500">{b.provider.vehicleType}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      b.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      b.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                      b.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">KSh {b.cost.toLocaleString()}</td>
                  <td className="p-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> {b.pickupLocation}</div>
                    <div className="flex items-center gap-1 mt-1"><Package className="w-3 h-3 text-green-500" /> {b.dropoffLocation}</div>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {b.transaction ? `Ref: ${b.transaction.reference.substring(0,8)}` : 
                     b.groupTransaction ? `Group: ${b.groupTransaction.reference.substring(0,8)}` : 'N/A'}
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No transport bookings recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
