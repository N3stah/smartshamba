export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { TrendingUp, BarChart3, Package } from 'lucide-react';
import { IMAGES } from '@/lib/image-constants';

export default async function MarketPricesPage() {
  const buyers = await prisma.buyer.findMany({ 
    where: { active: true, pricePerBag: { gt: 0 } }, 
    orderBy: { pricePerBag: 'desc' } 
  });
  const demands = await prisma.buyerDemand.findMany({
    where: { status: 'ACTIVE' },
    include: { buyer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  const predictions = await prisma.marketPrediction.findMany({
    where: { region: 'National' },
    orderBy: { generatedAt: 'desc' },
    distinct: ['crop', 'horizon'],
    take: 3
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative bg-gray-900 overflow-hidden">
          <div className="absolute inset-0">
            <img src={IMAGES["corn-closeup"]} alt="Close up of corn on the cob" className="w-full h-full object-cover opacity-40" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Market Price Insights</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">Real-time regional maize price trends per 90kg bag.</p>
          </div>
        </section>
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-[#00703C]" />
                <h2 className="text-xl font-bold text-gray-900">Active Purchase Requests</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demands.map((demand) => (
                  <div key={demand.id} className="border border-gray-200 rounded-xl p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900">{demand.product}</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{demand.quantityBags} bags</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{demand.location}</p>
                    <p className="text-sm text-gray-500">Buyer: {demand.buyer?.name ?? 'N/A'}</p>
                  </div>
                ))}
                {demands.length === 0 && <p className="text-gray-500 col-span-full">No active purchase requests at the moment.</p>}
              </div>
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
                  {predictions.length > 0 ? (
                    predictions.map((p) => (
                      <div key={p.id} className="border-l-4 border-green-500 pl-3">
                        <p className="font-semibold text-gray-900">{p.crop} ({p.horizon})</p>
                        <p>Rec: {p.recommendation} &mdash; Predicted: KSh {p.predictedPrice.toLocaleString()}</p>
                        {p.explanation && <p className="text-sm mt-1">{p.explanation}</p>}
                      </div>
                    ))
                  ) : (
                    <>
                      <p><strong className="text-gray-900">Price Trend:</strong> Maize prices are currently stable across Rift Valley, with a slight upward trend expected due to seasonal demand.</p>
                      <p><strong className="text-gray-900">Quality Premium:</strong> Buyers are offering up to 10% above base price for maize with moisture content below 13.5%.</p>
                      <p><strong className="text-gray-900">Group Selling Impact:</strong> Farmers participating in group selling are reporting an average 8% higher returns compared to individual sales.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
