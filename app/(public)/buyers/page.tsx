export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { ShieldCheck, MapPin } from 'lucide-react';
import { IMAGES } from '@/lib/image-constants';

export default async function BuyersPage() {
  const buyers = await prisma.buyer.findMany({ 
    where: { active: true }, 
    orderBy: { pricePerBag: 'desc' } 
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative bg-gray-900 overflow-hidden border-b border-border">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGES["corn-closeup"]} alt="Close up of corn on the cob" className="w-full h-full object-cover opacity-40" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-serif">Verified Maize Buyers</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">Connect directly with trusted grain millers and buyers across Rift Valley & Western Kenya.</p>
          </div>
        </section>
        <section className="py-16 lg:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {buyers.map((buyer) => (
                <div key={buyer.id} className="bg-surface rounded-lg border border-border shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-text font-serif">{buyer.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {buyer.location}</p>
                    </div>
                    <span className="bg-public-secondary text-public-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-public-primary/20"><ShieldCheck className="w-3 h-3" /> Verified</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-gray-500">Current Offer (90kg bag)</p>
                    <p className="text-2xl font-bold text-public-primary font-serif">KSh {buyer.pricePerBag.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-20 bg-public-primary rounded-lg p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4 font-serif">Are you a maize buyer?</h2>
              <p className="text-public-secondary mb-8 max-w-xl mx-auto">Join SmartShamba to source high-quality maize directly from farmers across Rift Valley and Western Kenya.</p>
              <Link href="/buyer/login" className="inline-block bg-white text-public-primary font-bold px-8 py-3 rounded-md hover:bg-gray-100 transition-colors">Join SmartShamba</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
