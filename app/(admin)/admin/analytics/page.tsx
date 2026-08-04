import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatCard from '@/components/analytics/StatCard';
import SalesTrendChart from '@/components/analytics/SalesTrendChart';
import CropPerformanceChart from '@/components/analytics/CropPerformanceChart';
import InsightCard from '@/components/analytics/InsightCard';
import MarketIntelligenceCard from '@/components/ai/MarketIntelligenceCard';
import DateFilter from '@/components/analytics/DateFilter';
import { Users, ShieldCheck, Building2, Package, ArrowLeft, DollarSign, TrendingUp, MessageSquare, KeyRound, AlertTriangle, CheckCircle, UsersRound, Coins, Trophy, Clock, Brain } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAnalytics(range: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/analytics?range=${range}`, {
    cache: 'no-store',
    headers: { 'x-admin-key': process.env.ADMIN_API_KEY ?? '' },
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const params = await searchParams;
  const range = params.range || '30d';

  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  let data;
  try {
    data = await getAnalytics(range);
  } catch (error) {
    return <div className="text-red-500 text-center py-12">Failed to load analytics data.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <div className="flex items-center gap-4">
          <DateFilter />
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      <MarketIntelligenceCard role="FARMER" />

      <InsightCard insights={data.insights || []} />

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Platform Overview & Verification</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Farmers" value={data.kpis.totalFarmers} icon={<Users className="w-5 h-5" />} />
          <StatCard label="Verified Farmers" value={data.kpis.verifiedFarmers} icon={<ShieldCheck className="w-5 h-5" />} />
          <StatCard label="Pending Farmer Verifs" value={data.kpis.pendingFarmers} icon={<Users className="w-5 h-5" />} />
          <StatCard label="Total Buyers" value={data.kpis.totalBuyers} icon={<Building2 className="w-5 h-5" />} />
          <StatCard label="Verified Buyers" value={data.kpis.verifiedBuyers} icon={<ShieldCheck className="w-5 h-5" />} />
          <StatCard label="Pending Buyer Verifs" value={data.kpis.pendingBuyers} icon={<Building2 className="w-5 h-5" />} />
          <StatCard label="Active Listings" value={data.kpis.activeListings} icon={<Package className="w-5 h-5" />} />
          <StatCard label="Active Demands" value={data.kpis.activeDemands} icon={<Package className="w-5 h-5" />} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Financial, Health & Disputes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={`KSh ${(data.kpis.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
          <StatCard label="Avg Transaction Value" value={`KSh ${(data.kpis.avgTxValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<Coins className="w-5 h-5" />} />
          <StatCard label="Largest Transaction" value={`KSh ${(data.kpis.largestTx || 0).toLocaleString()}`} icon={<Trophy className="w-5 h-5" />} />
          <StatCard label="Success Rate" value={`${data.kpis.successRate}%`} icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard label="Dispute Rate" value={`${data.kpis.disputeRate}%`} icon={<AlertTriangle className="w-5 h-5" />} />
          <StatCard label="Resolved Disputes" value={data.kpis.resolvedDisputes} icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard label="Avg Resolution Time" value={`${data.kpis.avgResolutionHours}h`} icon={<Clock className="w-5 h-5" />} />
          <StatCard label="Total Groups" value={data.kpis.totalGroups} icon={<UsersRound className="w-5 h-5" />} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SalesTrendChart data={data.charts.salesTrend} dataKey="revenue" color="#00703C" name={`Revenue Trend (${range})`} />
        <SalesTrendChart data={data.charts.registrationTrend} dataKey="farmers" color="#10B981" name={`Farmer Registrations (${range})`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <CropPerformanceChart data={data.charts.cropDemand} dataKey="bags" color="#F59E0B" name="Active Buyer Demand by Crop" />
        <CropPerformanceChart data={data.charts.tradedCrops} dataKey="bags" color="#8B5CF6" name="Actual Traded Volume by Crop" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="SMS Success Rate" value={`${data.system.smsSuccessRate.toFixed(1)}%`} icon={<MessageSquare className="w-5 h-5" />} />
          <StatCard label="SMS Sent" value={data.system.smsSent} icon={<MessageSquare className="w-5 h-5" />} />
          <StatCard label="SMS Failed" value={data.system.smsFailed} icon={<MessageSquare className="w-5 h-5" />} />
          <StatCard label="OTP Requests (24h)" value={data.system.otpRequests} icon={<KeyRound className="w-5 h-5" />} />
        </div>
      </div>
    </div>
  );
}
