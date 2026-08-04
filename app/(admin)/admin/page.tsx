import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/server';
import StatCard from '@/components/ui/StatCard';
import MarketIntelligenceCard from '@/components/ai/MarketIntelligenceCard';

interface Stats {
  totalFarmers: number;
  totalBuyers: number;
  totalTransactions: number;
  settledTransactions: number;
  pendingTransactions: number;
  disputedTransactions: number;
  activeFarmersLast30Days: number;
  groupActivity: {
    totalGroupTransactions: number;
    activeGroupsLast30Days: number;
  };
  averageBagsPerTransaction: number;
  completionRate: number;
  disputeRate: number;
  recentTransactions: Array<{
    reference: string;
    status: string;
    quantityBags: number;
    totalValue: number;
    farmer: { name: string | null; phone: string };
    buyer: { name: string };
  }>;
}

async function getStats(): Promise<Stats> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/stats`, {
    cache: 'no-store',
    headers: { 'x-admin-key': process.env.ADMIN_API_KEY ?? '' },
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const t = await getDictionary();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
        <p className="text-gray-500 text-sm mt-1">Trans Nzoia County Pilot · {t.dashboard.overview}</p>
      </div>

      {/* KPI Row 1 */}
      <MarketIntelligenceCard role="FARMER" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label={t.dashboard.registeredFarmers} value={stats.totalFarmers} />
        <StatCard label={t.dashboard.verifiedBuyers} value={stats.totalBuyers} />
        <StatCard label={t.dashboard.totalTransactions} value={stats.totalTransactions} />
        <StatCard
          label="Avg Bags / Transaction"
          value={stats.averageBagsPerTransaction.toFixed(1)}
          highlight
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending" value={stats.pendingTransactions} sub="Awaiting confirmation" />
        <StatCard label="Disputed" value={stats.disputedTransactions} sub="Requires resolution" />
        <StatCard label="Settled" value={stats.settledTransactions} sub="Payment received" />
        <StatCard
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          highlight={stats.completionRate > 50}
        />
      </div>

      {/* Phase 11: Internal Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatCard 
          label="Active Farmers (30d)" 
          value={stats.activeFarmersLast30Days} 
          sub="Users who transacted recently" 
        />
        <StatCard 
          label="Group Activity" 
          value={stats.groupActivity.totalGroupTransactions} 
          sub={`${stats.groupActivity.activeGroupsLast30Days} active groups`} 
        />
        <StatCard 
          label="Dispute Rate" 
          value={`${stats.disputeRate}%`} 
          sub="Health indicator" 
        />
      </div>

      {/* System Status */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-sm font-semibold text-gray-900">{t.dashboard.systemStatus}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'API', status: t.dashboard.operational },
            { label: 'Database', status: t.dashboard.operational },
            { label: 'SMS', status: t.dashboard.operational },
            { label: 'USSD', status: 'Active' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-100 rounded-full">{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            href: '/admin/transactions',
            label: 'View Transactions',
            desc: 'Search, filter, and manage all transactions',
            icon: '🔄',
          },
          {
            href: '/admin/buyers',
            label: 'Manage Buyers',
            desc: 'Add, edit, or deactivate verified buyers',
            icon: '🏢',
          },
          {
            href: '/admin/audit-logs',
            label: 'Audit Logs',
            desc: 'Track all admin actions and system changes',
            icon: '🛡️',
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-slate-200/80 hover:border-green-400 hover:shadow-md rounded-xl p-5 transition-all group"
          >
            <div className="text-2xl mb-3">{link.icon}</div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
              {link.label}
            </p>
            <p className="text-xs text-gray-400 mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
