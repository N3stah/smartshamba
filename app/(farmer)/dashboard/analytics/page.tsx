import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatCard from '@/components/analytics/StatCard';
import SalesTrendChart from '@/components/analytics/SalesTrendChart';
import CropPerformanceChart from '@/components/analytics/CropPerformanceChart';
import InsightCard from '@/components/analytics/InsightCard';
import DateFilter from '@/components/analytics/DateFilter';
import TopBuyersList from '@/components/analytics/TopBuyersList';
import { ArrowLeft, Package, DollarSign, Star, TrendingUp, ShoppingBag, UsersRound, ThumbsUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAnalytics(range: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const headersList = await headers();
  const cookie = headersList.get('cookie') || '';
  
  const res = await fetch(`${baseUrl}/api/farmers/me/analytics?range=${range}`, {
    cache: 'no-store',
    headers: { cookie },
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export default async function FarmerAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const params = await searchParams;
  const range = params.range || '30d';

  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  let data;
  try {
    data = await getAnalytics(range);
  } catch (error) {
    return <div className="text-red-500 text-center py-12">Failed to load analytics data.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Farm Analytics</h1>
        <div className="flex items-center gap-4">
          <DateFilter />
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      <InsightCard insights={data.insights || []} />

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Farm Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Earnings" value={`KSh ${data.kpis.totalEarnings.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
          <StatCard label="Total Bags Sold" value={data.kpis.totalBags} icon={<ShoppingBag className="w-5 h-5" />} />
          <StatCard label="Avg Rating" value={data.kpis.avgRating.toFixed(1)} icon={<Star className="w-5 h-5" />} />
          <StatCard label="Positive Ratings" value={data.kpis.positiveRatings} icon={<ThumbsUp className="w-5 h-5" />} />
          <StatCard label="Active Listings" value={data.kpis.activeListings} icon={<Package className="w-5 h-5" />} />
          <StatCard label="Completed Sales" value={data.kpis.settledTransactions} icon={<TrendingUp className="w-5 h-5" />} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Group Selling</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Groups Joined" value={data.kpis.groupsJoined} icon={<UsersRound className="w-5 h-5" />} />
          <StatCard label="Group Earnings" value={`KSh ${data.kpis.groupEarnings.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SalesTrendChart data={data.charts.salesTrend} dataKey="revenue" color="#00703C" name={`Earnings Trend (${range})`} />
        <SalesTrendChart data={data.charts.priceTrend} dataKey="avgPrice" color="#3B82F6" name={`Average Price per Bag Trend (${range})`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <CropPerformanceChart data={data.charts.cropPerformance} dataKey="bags" color="#10B981" name="Bags Sold by Crop" />
        <TopBuyersList buyers={data.charts.topBuyers} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <CropPerformanceChart data={data.charts.marketDemand} dataKey="bags" color="#F59E0B" name="Active Market Demand (What Buyers Want)" />
      </div>
    </div>
  );
}
