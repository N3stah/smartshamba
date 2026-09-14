'use client';
import { useEffect, useState } from 'react';
import { Loader2, Users, TrendingUp, Package, Megaphone, Activity, Truck, AlertTriangle, CloudRain, CheckCircle } from 'lucide-react';

interface PMData {
  newFarmers30d: number;
  newBuyers30d: number;
  activeListings: number;
  activeDemands: number;
  activeTransport: number;
  disputedTx: number;
  weatherAlerts: number;
  txVolume30d: number;
}

export default function PMDashboard() {
  const [data, setData] = useState<PMData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive-bi')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setData({
            newFarmers30d: d.growth?.newFarmers30d || 0,
            newBuyers30d: d.growth?.newBuyers30d || 0,
            activeListings: d.growth?.activeListings || 0,
            activeDemands: d.growth?.activeDemands || 0,
            activeTransport: d.cfo?.activeTransport || 0,
            disputedTx: d.risk?.disputedTx || 0,
            weatherAlerts: d.agintel?.weatherAlerts || 0,
            txVolume30d: d.cfo?.txVolume30d || 0
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;
  if (!data) return <div className="bg-white p-8 text-center text-gray-500 rounded-xl border">Failed to load product data.</div>;

  const kpis = [
    { label: 'New Farmers (30d)', value: data.newFarmers30d, sub: 'Field Adoption', icon: Users, color: 'text-blue-600' },
    { label: 'New Buyers (30d)', value: data.newBuyers30d, sub: 'Market Growth', icon: Users, color: 'text-purple-600' },
    { label: 'Active Transport', value: data.activeTransport, sub: 'Logistics in Transit', icon: Truck, color: 'text-orange-600' },
    { label: 'Disputes', value: data.disputedTx, sub: 'Requires Mediation', icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Product Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase">{k.label}</p>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Product & Feature Rollout Status */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Product & Feature Rollouts (V2)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">USSD (*384*53374#)</p>
              <p className="text-xs text-gray-500">Live & Stable</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">M-PESA C2B Integration</p>
              <p className="text-xs text-gray-500">Live (Sandbox)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">AI Market Intel</p>
              <p className="text-xs text-gray-500">Active (6 Predictions)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <Loader2 className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">GIS Geofencing</p>
              <p className="text-xs text-gray-500">Pilot Phase</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Package className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Digital Contracts</p>
              <p className="text-xs text-gray-500">Awaiting Transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supply Chain & Risk Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-orange-600" /> Supply Chain & Logistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Active Transport Jobs</span>
              <span className="font-bold text-orange-700">{data.activeTransport}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Active Supply (Listings)</span>
              <span className="font-bold text-green-700">{data.activeListings}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Active Demand (Buyers)</span>
              <span className="font-bold text-purple-700">{data.activeDemands}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Monitor field execution and ensure transport providers are meeting delivery schedules.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Risk & Compliance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Active Disputes</span>
              </div>
              <span className="font-bold text-red-700">{data.disputedTx}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Weather Alerts (30d)</span>
              </div>
              <span className="font-bold text-blue-700">{data.weatherAlerts}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Monitor localized risks and ensure compliance with Kenyan agricultural trading regulations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
