import Link from 'next/link';

interface Stats {
  farmers: number;
  buyers: number;
  transactions: { total: number; pending: number; confirmed: number };
  volume: { totalBags: number; totalValue: number };
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

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-6 bg-white shadow-sm ${highlight ? 'border-green-300' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const settled = stats.transactions.total - stats.transactions.pending - stats.transactions.confirmed;
  const successRate = stats.transactions.total > 0
    ? Math.round((settled / stats.transactions.total) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Trans Nzoia County Pilot · Real-time overview</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Registered Farmers" value={stats.farmers} />
        <StatCard label="Verified Buyers" value={stats.buyers} />
        <StatCard label="Total Transactions" value={stats.transactions.total} />
        <StatCard
          label="Total Volume"
          value={`KSh ${stats.volume.totalValue.toLocaleString()}`}
          sub={`${stats.volume.totalBags} bags`}
          highlight
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending" value={stats.transactions.pending} sub="Awaiting confirmation" />
        <StatCard label="Confirmed" value={stats.transactions.confirmed} sub="Buyer accepted" />
        <StatCard label="Settled" value={settled} sub="Payment received" />
        <StatCard
          label="Settlement Rate"
          value={`${successRate}%`}
          highlight={successRate > 50}
        />
      </div>

      {/* System Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-sm font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'API', status: 'Operational' },
            { label: 'Database', status: 'Operational' },
            { label: 'SMS', status: 'Operational' },
            { label: 'USSD', status: 'Active' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <span className="text-xs text-green-600 font-medium">{item.status}</span>
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
            href: '/admin/farmers',
            label: 'View Farmers',
            desc: 'Browse registered pilot farmers',
            icon: '👨‍🌾',
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-gray-200 hover:border-green-400 hover:shadow-md rounded-xl p-5 transition-all group"
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
