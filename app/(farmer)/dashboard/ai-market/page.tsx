import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import MarketIntelligenceCard from '@/components/ai/MarketIntelligenceCard';
import AITrendChart from '@/components/ai/AITrendChart';
import { ArrowLeft, Brain } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FarmerAIMarketPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const predictions = await prisma.marketPrediction.findMany({
    where: { region: 'National' },
    orderBy: { generatedAt: 'desc' },
    distinct: ['crop', 'horizon']
  });

  const maizePreds = predictions.filter(p => p.crop === 'Maize').sort((a, b) => a.horizon.localeCompare(b.horizon));
  const beansPreds = predictions.filter(p => p.crop === 'Beans').sort((a, b) => a.horizon.localeCompare(b.horizon));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-[#00703C]" />
          <h1 className="text-2xl font-bold text-gray-900">AI Market Intelligence</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <MarketIntelligenceCard role="FARMER" />

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Maize Forecast Analysis</h2>
        <AITrendChart predictions={maizePreds} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Beans Forecast Analysis</h2>
        <AITrendChart predictions={beansPreds} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800">
        <p className="font-bold mb-2">How to use this intelligence:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>If the AI recommends <strong>WAIT</strong>, consider holding your harvest for a few weeks to capture higher prices.</li>
          <li>If the AI recommends <strong>SELL</strong>, list your produce immediately on the marketplace to lock in current prices before they drop.</li>
          <li>Use the confidence score to gauge market volatility. A lower score means prices are less predictable.</li>
        </ul>
        <p className="mt-3 text-xs italic">* Predictions are based on historical SmartShamba data and AI modeling. They are estimates, not guarantees.</p>
      </div>
    </div>
  );
}
