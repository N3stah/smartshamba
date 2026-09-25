import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Users, ArrowRight, Handshake, TrendingUp } from 'lucide-react';

export default function GroupSellingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative bg-gray-900 overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-serif">Collective Farmer Selling</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">Pool your harvest with nearby farmers to negotiate higher bulk market rates with major grain millers.</p>
          </div>
        </section>
        <section className="py-16 lg:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <div className="p-8 rounded-lg border border-border shadow-sm bg-surface">
                <div className="w-12 h-12 bg-public-secondary rounded-md flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-public-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-text font-serif">Pool Harvests</h3>
                <p className="text-gray-600 text-sm">Smallholder farmers combine their maize quantities to meet the high-volume demands of institutional buyers.</p>
              </div>
              <div className="p-8 rounded-lg border border-border shadow-sm bg-surface">
                <div className="w-12 h-12 bg-public-secondary rounded-md flex items-center justify-center mb-6">
                  <Handshake className="w-6 h-6 text-public-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-text font-serif">Negotiate Better</h3>
                <p className="text-gray-600 text-sm">Leverage collective volume to command premium prices that individual farmers cannot access alone.</p>
              </div>
              <div className="p-8 rounded-lg border border-border shadow-sm bg-surface">
                <div className="w-12 h-12 bg-public-secondary rounded-md flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-public-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-text font-serif">Secure Payments</h3>
                <p className="text-gray-600 text-sm">Transactions are tracked and settled transparently, ensuring every farmer gets their fair share directly.</p>
              </div>
            </div>
            <div className="bg-public-primary rounded-lg p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4 font-serif">Ready to increase your earnings?</h2>
              <p className="text-public-secondary mb-8 max-w-xl mx-auto">Access the group selling dashboard to join or create a village group today.</p>
              <Link href="/dashboard/login?from=%2Fdashboard" className="inline-flex items-center gap-2 bg-white text-public-primary font-bold px-8 py-3 rounded-md hover:bg-gray-100 transition-colors">
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
