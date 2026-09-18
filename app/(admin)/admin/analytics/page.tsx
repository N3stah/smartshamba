import { cookies } from 'next/headers';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RegistrationsChart from '@/components/admin/charts/RegistrationsChart';
import CropDemandChart from '@/components/admin/charts/CropDemandChart';

export const dynamic = 'force-dynamic';

async function getAnalytics(range: string) {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/analytics?range=${range}`, {
    cache: 'no-store',
    headers: { cookie: cookieStore.toString() },
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const params = await searchParams;
  const range = params.range || '30d';

  let analytics = null;
  let error = null;
  try { analytics = await getAnalytics(range); } catch (e) { error = 'Failed to load analytics data.'; console.error(e); }

  const kpis = analytics?.kpis || {};
  const charts = analytics?.charts || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">KSh {kpis.totalRevenue?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-sm text-gray-500">Avg Transaction Value</p>
              <p className="text-2xl font-bold text-gray-900">KSh {kpis.avgTxValue?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.successRate || 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">Farmer Registrations</h3>
              <RegistrationsChart data={charts.registrationTrend || []} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">Crop Demand (Bags)</h3>
              <CropDemandChart data={charts.cropDemand || []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
