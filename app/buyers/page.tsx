import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { ShieldCheck, Star, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BuyersPage() {
  const buyers = await prisma.buyer.findMany({ 
    where: { active: true }, 
    orderBy: { pricePerBag: 'desc' } 
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900">Verified Maize Buyers</h1>
          <p className="mt-4 text-lg text-gray-600">Connect directly with trusted grain millers and buyers across Kenya.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {buyers.map((buyer) => (
            <div key={buyer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{buyer.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" /> {buyer.location}
                  </p>
                </div>
                <span className="bg-green-100 text-[#00703C] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-sm text-gray-500">Current Offer (90kg bag)</p>
                <p className="text-2xl font-bold text-[#00703C]">KSh {buyer.pricePerBag.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-[#00703C] rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Are you a maize buyer?</h2>
          <p className="text-green-100 mb-8 max-w-xl mx-auto">Join SmartShamba to source high-quality maize directly from farmers across Rift Valley and Western Kenya.</p>
          <Link href="/buyer/login" className="inline-block bg-white text-[#00703C] font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            Join SmartShamba
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
