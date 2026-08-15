import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Brain, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MarketReportsPage() {
  const cookieStore = await cookies();
  const farmerPhone = cookieStore.get('smartshamba_farmer')?.value;
  const buyerPhone = cookieStore.get('smartshamba_buyer')?.value;
  if (!farmerPhone && !buyerPhone) {
    redirect('/dashboard/login'); // Or buyer login
  }

  const predictions = await prisma.marketPrediction.findMany({
    orderBy: [
      { crop: 'asc' },
      { horizon: 'asc'
      }
    ]
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Brain className="w-6 h-6 text-[#00703C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Market Reports</h1>
              <p className="text-sm text-gray-500">Comprehensive price forecasts and market intelligence</p>
            </div>
          </div>
          <Link href={farmerPhone ? '/dashboard' : '/buyer/dashboard'} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Crop</th>
                  <th className="p-4 font-semibold text-gray-600">Horizon</th>
                  <th className="p-4 font-semibold text-gray-600">Current Price (KSh)</th>
                  <th className="p-4 font-semibold text-gray-600">Predicted Price (KSh)</th>
                  <th className="p-4 font-semibold text-gray-600">Confidence</th>
                  <th className="p-4 font-semibold text-gray-600">AI Explanation</th>
                  <th className="p-4 font-semibold text-gray-600">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{p.crop}</td>
                    <td className="p-4 text-gray-600 uppercase">{p.horizon}</td>
                    <td className="p-4 text-gray-600">{p.currentPrice.toLocaleString()}</td>
                    <td className="p-4 font-bold text-gray-900">{p.predictedPrice.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-[#00703C] h-1.5 rounded-full" style={{ width: `${p.confidenceScore}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{p.confidenceScore}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500 italic max-w-xs truncate" title={p.explanation}>
                      &quot;{p.explanation}&quot;
                    </td>
                    <td className="p-4">
                      {p.accuracy ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> {p.accuracy}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
                {predictions.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">No AI predictions generated yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
