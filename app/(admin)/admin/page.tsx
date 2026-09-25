import { cookies } from 'next/headers';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Users, Building2, ArrowLeftRight, ShieldCheck, TrendingUp } from 'lucide-react';
import RevenueChart from '@/components/admin/charts/RevenueChart';

export const dynamic = 'force-dynamic';

async function getStats() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/stats`, {
    cache: 'no-store',
    headers: { cookie: cookieStore.toString() },
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  let stats = null;
  let error = null;
  try { stats = await getStats(); } catch (e) { error = 'Failed to load statistics.'; console.error(e); }

  const kpis = stats?.kpis || {};
  const charts = stats?.charts || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-500">Total Farmers</p>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalFarmers || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-500">Total Buyers</p>
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalBuyers || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-500">Open Transactions</p>
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.pendingTransactions || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.completionRate || 0}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-admin-primary" /> Revenue Trend (Last 30 Days)</h3>
            <RevenueChart data={charts.salesTrend || []} />
          </div>
        </>
      )}
    </div>
  );
}
