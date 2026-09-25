export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import RateBuyerButton from './RateBuyerButton';
import SyncPoller from './SyncPoller';
import EmptyState from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { getDictionary } from '@/lib/i18n/server';
import { Tag, ArrowRight, Wallet, Users, TrendingUp } from 'lucide-react';

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

export default async function FarmerDashboard() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const data = await getFarmerData(phone);
  if (!data) redirect('/dashboard/login');

  const { farmer, transactions, stats, settled } = data;
  const t = await getDictionary();

  return (
    <div className="space-y-8">
      <SyncPoller />
      
      <div>
        <h1 className="text-2xl font-bold text-text">
          {t.common.welcome}, {farmer.name ?? 'Farmer'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {farmer.ward?.name ? `${farmer.ward.name}, ` : ''}{farmer.county?.name ?? farmer.location ?? ''}
        </p>
      </div>

      {/* Action-First Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text mb-2">Ready to sell?</h2>
            <p className="text-sm text-gray-500 mb-4">List your available maize harvest for buyers to see.</p>
          </div>
          <Link href="/dashboard/listings" className="inline-block">
            <Button size="lg" className="w-full md:w-auto">
              <Tag className="w-4 h-4 mr-2" /> Post Produce
            </Button>
          </Link>
        </Card>
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text mb-2">Active Buyer Demands</h2>
            <p className="text-sm text-gray-500 mb-4">See what buyers are actively purchasing right now.</p>
          </div>
          <Link href="/dashboard/demands" className="inline-block">
            <Button variant="outline" size="lg" className="w-full md:w-auto">
              View Demands <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.dashboard.totalTransactions}</p>
          <p className="text-2xl font-bold text-text mt-1">{stats._count.id}</p>
        </Card>
        <Card className="p-5 border-farmer-primary/20">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Settled</p>
          <p className="text-2xl font-bold text-farmer-primary mt-1">{settled}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.dashboard.totalBagsSold}</p>
          <p className="text-2xl font-bold text-text mt-1">{stats._sum.quantityBags ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.dashboard.totalValue}</p>
          <p className="text-xl font-bold text-text mt-1">
            KSh {(stats._sum.totalValue ?? 0).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* V2 Quick Access List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Intelligence & Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/ai-market" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-farmer-secondary rounded-md flex items-center justify-center text-farmer-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text text-sm">AI Market Intel</h3>
              <p className="text-xs text-gray-500">Price predictions & recommendations</p>
            </div>
          </Link>
          <Link href="/dashboard/wallet" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-farmer-secondary rounded-md flex items-center justify-center text-farmer-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text text-sm">My Wallet</h3>
              <p className="text-xs text-gray-500">Balance, ledger & withdrawals</p>
            </div>
          </Link>
          <Link href="/dashboard/groups" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-farmer-secondary rounded-md flex items-center justify-center text-farmer-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text text-sm">Farmer Groups</h3>
              <p className="text-xs text-gray-500">Join groups, combine harvests</p>
            </div>
          </Link>
        </div>
      </Card>

      <div className="bg-farmer-primary text-white rounded-lg p-4 text-center">
        <p className="text-sm font-medium">📱 Dial *384*53374# to sell maize via your phone</p>
      </div>

      {/* Recent Transactions */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">{t.dashboard.recentTransactions}</h2>
          <Link href="/dashboard/transactions" className="text-xs text-farmer-primary hover:underline">{t.dashboard.viewAll} →</Link>
        </div>
        <div className="divide-y divide-border">
          {transactions.length === 0 ? (
            <EmptyState message={t.emptyStates.noTransactions} />
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-gray-500">{tx.reference}</p>
                  <p className="text-sm font-medium text-text mt-0.5">{tx.buyer.name}</p>
                  <p className="text-xs text-gray-500">{tx.quantityBags} bags · KSh {tx.totalValue.toLocaleString()}</p>
                  {tx.status === 'SETTLED' && (
                    <RateBuyerButton
                      transactionId={tx.id}
                      buyerName={tx.buyer.name}
                      existingScore={tx.ratings[0]?.score ?? null}
                    />
                  )}
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={tx.status} />
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(tx.createdAt).toLocaleDateString('en-KE', { day:'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
