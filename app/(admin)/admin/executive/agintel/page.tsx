'use client';
import { useEffect, useState } from 'react';
import { Loader2, CloudRain, TrendingUp } from 'lucide-react';

export default function AgIntelDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi').then(r => r.ok ? r.json() : null).then(d => setData(d?.agintel)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm flex items-center justify-between">
          <div><p className="text-xs text-gray-500 uppercase">Weather Alerts (30d)</p><p className="text-2xl font-bold text-gray-900 mt-1">{data?.weatherAlerts}</p></div>
          <CloudRain className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#00703C]" /> Top Supply (Active Bags)</h3>
          <div className="space-y-2">
            {data?.supplyByCrop?.map((s: any) => (
              <div key={s.crop} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{s.crop}</span>
                <span className="text-sm font-bold">{s.bags} bags</span>
              </div>
            ))}
            {(!data?.supplyByCrop || data.supplyByCrop.length === 0) && <p className="text-gray-400 text-sm">No active supply.</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Top Demand (Active Bags)</h3>
          <div className="space-y-2">
            {data?.demandByCrop?.map((d: any) => (
              <div key={d.crop} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{d.crop}</span>
                <span className="text-sm font-bold">{d.bags} bags</span>
              </div>
            ))}
            {(!data?.demandByCrop || data.demandByCrop.length === 0) && <p className="text-gray-400 text-sm">No active demand.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
