import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Users, ArrowRight, Handshake, TrendingUp } from 'lucide-react';
import { IMAGES } from '@/lib/image-constants';

export default function GroupSellingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative bg-gray-900 overflow-hidden">
          <div className="absolute inset-0">
            <img src={IMAGES["corn-pile"]} alt="Pile of corn" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Collective Farmer Selling</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">Pool your harvest with nearby farmers to negotiate higher bulk market rates with major grain millers.</p>
          </div>
        </section>
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <div className="p-8 rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-[#00703C]" />
                </div>
                <h3 className="text-lg font-bold mb-2">Pool Harvests</h3>
                <p className="text-gray-600 text-sm">Smallholder farmers combine their maize quantities to meet the high-volume demands of institutional buyers.</p>
              </div>
              <div className="p-8 rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                  <Handshake className="w-6 h-6 text-[#00703C]" />
                </div>
                <h3 className="text-lg font-bold mb-2">Negotiate Better</h3>
                <p className="text-gray-600 text-sm">Leverage collective volume to command premium prices that individual farmers cannot access alone.</p>
              </div>
              <div className="p-8 rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-[#00703C]" />
                </div>
                <h3 className="text-lg font-bold mb-2">Secure Payments</h3>
                <p className="text-gray-600 text-sm">Transactions are tracked and settled transparently, ensuring every farmer gets their fair share directly.</p>
              </div>
            </div>
            <div className="bg-[#00703C] rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to increase your earnings?</h2>
              <p className="text-green-100 mb-8 max-w-xl mx-auto">Access the group selling dashboard to join or create a village group today.</p>
              <Link href="/dashboard/login?from=%2Fdashboard" className="inline-flex items-center gap-2 bg-white text-[#00703C] font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Access Farmer Portal <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
