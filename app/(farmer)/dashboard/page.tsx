import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import RateBuyerButton from './RateBuyerButton';
import SyncPoller from './SyncPoller';
import MarketIntelligenceCard from '@/components/ai/MarketIntelligenceCard';
import DailyBriefCard from '@/components/ai/DailyBriefCard';
import WeatherCard from '@/components/weather/WeatherCard';
import EmptyState from '@/components/ui/EmptyState';
import { getDictionary } from '@/lib/i18n/server';

async function getFarmerData(phone: string) {
  const farmer = await prisma.farmer.findUnique({
    where: { phone },
    include: { county: true, ward: true },
  });
  if (!farmer) return null;

  const transactions = await prisma.transaction.findMany({
    where: { farmerId: farmer.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      buyer: true,
      ratings: { where: { raterType: 'FARMER' } },
    },
  });

  const stats = await prisma.transaction.aggregate({
    where: { farmerId: farmer.id },
    _count: { id: true },
    _sum: { totalValue: true, quantityBags: true },
  });

  const settled = await prisma.transaction.count({
    where: { farmerId: farmer.id, status: 'SETTLED' },
  });

  return { farmer, transactions, stats, settled };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SETTLED:   'bg-green-100 text-green-800',
  DISPUTED:  'bg-red-100 text-red-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
};

export default async function FarmerDashboard() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const data = await getFarmerData(phone);
  if (!data) redirect('/dashboard/login');

  const { farmer, transactions, stats, settled } = data;
  const t = await getDictionary();

  return (
    <div>
      <SyncPoller />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t.common.welcome}, {farmer.name ?? 'Farmer'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {farmer.ward?.name ? `${farmer.ward.name}, ` : ''}{farmer.county?.name ?? farmer.location ?? ''}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.dashboard.totalTransactions}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats._count.id}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Settled</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{settled}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.dashboard.totalBagsSold}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats._sum.quantityBags ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-300 p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.dashboard.totalValue}</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            KSh {(stats._sum.totalValue ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <DailyBriefCard role="FARMER" />
      <MarketIntelligenceCard role="FARMER" />
      <WeatherCard county={farmer.county?.name ?? 'Trans Nzoia'} />
      <div className="bg-green-800 text-white rounded-xl p-6 mb-8">
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Farmer Groups
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Join a farmer group, combine harvests with nearby farmers and negotiate better prices with buyers.
              </p>
            </div>
            <Link
              href="/dashboard/groups"
              className="bg-green-700 hover:bg-green-600 text-white px-5 py-3 rounded-lg font-medium transition-colors"
            >
              View Groups →
            </Link>
          </div>
        </div>
        <p className="font-semibold">{t.dashboard.readyToSell}</p>
        <p className="text-green-200 text-sm mt-1">
          {t.dashboard.dialUssd}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">{t.dashboard.recentTransactions}</h2>
          <Link href="/dashboard/transactions" className="text-xs text-green-700 hover:underline">{t.dashboard.viewAll} →</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <EmptyState message={t.emptyStates.noTransactions} />
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-betweengap-4">
                <div>
                  <p className="font-mono text-xs text-gray-600">{tx.reference}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{tx.buyer.name}</p>
                  <p className="text-xs text-gray-400">{tx.quantityBags} bags · KSh {tx.totalValue.toLocaleString()}</p>
                  {tx.status === 'SETTLED' && (
                    <RateBuyerButton
                      transactionId={tx.id}
                      buyerName={tx.buyer.name}
                      existingScore={tx.ratings[0]?.score ?? null}
                    />
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {tx.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(tx.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
