import { prisma } from '@/lib/prisma';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { TrendingUp, BarChart3 } from 'lucide-react';

export default async function MarketPricesPage() {
  const buyers = await prisma.buyer.findMany({ 
    where: { active: true, pricePerBag: { gt: 0 } }, 
    orderBy: { pricePerBag: 'desc' } 
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900">Market Price Insights</h1>
          <p className="mt-4 text-lg text-gray-600">Real-time regional maize price trends per 90kg bag.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-[#00703C]" />
              <h2 className="text-xl font-bold text-gray-900">Current Top Buyer Offers</h2>
            </div>
            <div className="space-y-4">
              {buyers.map((buyer) => (
                <div key={buyer.id} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-900">{buyer.name}</p>
                    <p className="text-sm text-gray-500">{buyer.location}</p>
                  </div>
                  <p className="text-lg font-bold text-[#00703C]">KSh {buyer.pricePerBag.toLocaleString()}</p>
                </div>
              ))}
              {buyers.length === 0 && <p className="text-gray-500">No active buyer offers at the moment.</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#00703C]" />
              <h2 className="text-xl font-bold text-gray-900">Market Advisory Notes</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p><strong className="text-gray-900">Price Trend:</strong> Maize prices are currently stable across Rift Valley, with a slight upward trend expected due to seasonal demand.</p>
              <p><strong className="text-gray-900">Quality Premium:</strong> Buyers are offering up to 10% above base price for maize with moisture content below 13.5%.</p>
              <p><strong className="text-gray-900">Group Selling Impact:</strong> Farmers participating in group selling are reporting an average 8% higher returns compared to individual sales.</p>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
