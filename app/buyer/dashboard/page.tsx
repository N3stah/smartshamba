export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Brain, Wallet, FileText, CloudRain, MessageSquare, ClipboardList } from 'lucide-react';

export default async function BuyerDashboard() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ 
    where: { phone },
    include: { 
      transactions: { 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        include: { farmer: true }
      } 
    }
  });

  if (!buyer) redirect('/buyer/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text font-serif">Welcome, {buyer.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your buying offers and transactions</p>
      </div>

      {/* Bento Grid: Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Current offer</p>
          <p className="text-2xl font-bold text-text mt-1">KSh {buyer.pricePerBag}/bag</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Capacity</p>
          <p className="text-2xl font-bold text-text mt-1">{buyer.capacityBags} bags</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
          <p className="text-2xl font-bold text-text mt-1">{buyer.location}</p>
        </Card>
      </div>

      {/* Bento Grid: Procurement + Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Procurement Actions (Wide) */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold text-text mb-4 font-serif">Procurement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/buyer/demands" className="flex items-center gap-3 p-4 rounded-md border border-border hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-buyer-secondary rounded-md flex items-center justify-center text-buyer-primary">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm">Demands</h3>
                <p className="text-xs text-gray-500">Manage purchase requests</p>
              </div>
            </Link>
            <Link href="/buyer/wallet" className="flex items-center gap-3 p-4 rounded-md border border-border hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-buyer-secondary rounded-md flex items-center justify-center text-buyer-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm">Wallet</h3>
                <p className="text-xs text-gray-500">Balance & transaction history</p>
              </div>
            </Link>
            <Link href="/buyer/contracts" className="flex items-center gap-3 p-4 rounded-md border border-border hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-buyer-secondary rounded-md flex items-center justify-center text-buyer-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm">Contracts</h3>
                <p className="text-xs text-gray-500">View digital trade agreements</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Intelligence & Tools (Narrow) */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text mb-4 font-serif">Tools & insights</h2>
          <div className="space-y-4">
            <Link href="/buyer/ai-procurement" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-buyer-secondary rounded-md flex items-center justify-center text-buyer-primary">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm">Procurement intelligence</h3>
                <p className="text-xs text-gray-500">Smart buying recommendations</p>
              </div>
            </Link>
            <Link href="/buyer/weather" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-buyer-secondary rounded-md flex items-center justify-center text-buyer-primary">
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm">Weather</h3>
                <p className="text-xs text-gray-500">Regional weather insights</p>
              </div>
            </Link>
            <Link href="/buyer/assistant" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-buyer-secondary rounded-md flex items-center justify-center text-buyer-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm">Assistant</h3>
                <p className="text-xs text-gray-500">Ask about market trends</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Transactions (Full Width) */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Recent transactions</h2>
        </div>
        <div className="divide-y divide-border">
          {buyer.transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No transactions yet.</div>
          ) : (
            buyer.transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-gray-500">{tx.reference}</p>
                  <p className="text-sm font-medium text-text mt-0.5">{tx.farmer.name ?? 'Farmer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text">{tx.quantityBags} bags</p>
                  <p className="text-xs text-gray-400">KSh {tx.totalValue.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
