import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Brain, TrendingUp, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAIDashboardPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  const predictions = await prisma.marketPrediction.findMany({
    orderBy: [
      { crop: 'asc' },
      { horizon: 'asc' }
    ]
  });

  const getRecStyle = (rec: string) => {
    switch (rec.toUpperCase()) {
      case 'SELL': case 'BUY': return 'bg-green-100 text-green-800 border border-green-200';
      case 'WAIT': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Brain className="w-6 h-6 text-[#00703C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Market Intelligence</h1>
            <p className="text-sm text-gray-500">National price forecasts and marketplace predictions</p>
          </div>
        </div>
        <Link href="/admin/analytics" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Analytics
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.slice(0, 3).map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{p.crop} ({p.horizon})</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">KSh {p.predictedPrice.toLocaleString()}</p>
              </div>
              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${getRecStyle(p.recommendation)}`}>
                {p.recommendation}
              </span>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic">"{p.explanation}"</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Detailed Forecast History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Crop</th>
                <th className="p-4 font-semibold text-gray-600">Horizon</th>
                <th className="p-4 font-semibold text-gray-600">Current (KSh)</th>
                <th className="p-4 font-semibold text-gray-600">Predicted (KSh)</th>
                <th className="p-4 font-semibold text-gray-600">Confidence</th>
                <th className="p-4 font-semibold text-gray-600">AI Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {predictions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No AI predictions generated yet.</td></tr>
              ) : (
                predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{p.crop}</td>
                    <td className="p-4 text-gray-600 uppercase">{p.horizon}</td>
                    <td className="p-4 text-gray-600">{p.currentPrice.toLocaleString()}</td>
                    <td className="p-4 font-bold text-gray-900 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      {p.predictedPrice.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-[#00703C] h-1.5 rounded-full" style={{ width: `${p.confidenceScore}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{p.confidenceScore}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500 italic max-w-xs truncate" title={p.explanation}>
                      "{p.explanation}"
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
