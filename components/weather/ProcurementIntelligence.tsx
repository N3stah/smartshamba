'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, ShoppingCart, Clock, Loader2 } from 'lucide-react';

interface Intelligence {
  supply_impact: string;
  price_impact: string;
  procurement_rec: string;
  risk_level: string;
  urgency: string;
}

export default function ProcurementIntelligence({ county }: { county: string }) {
  const [intel, setIntel] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const res = await fetch(`/api/ai/procurement-intelligence?county=${encodeURIComponent(county)}`);
        if (res.ok) {
          const data = await res.json();
          setIntel(data.intelligence);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchIntel();
  }, [county]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#00703C]" />
      </div>
    );
  }

  if (!intel) return null;

  const getRiskStyle = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getUrgencyStyle = (urgency: string) => {
    if (urgency.toLowerCase().includes('immediate')) return 'bg-red-600 text-white';
    if (urgency.toLowerCase().includes('3 days')) return 'bg-orange-500 text-white';
    if (urgency.toLowerCase().includes('1 week')) return 'bg-yellow-500 text-white';
    return 'bg-green-600 text-white';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#00703C]" />
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">AI Procurement Intelligence</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-800 uppercase">Supply Impact</span>
          </div>
          <p className="text-sm text-gray-700">{intel.supply_impact}</p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-800 uppercase">Price Impact</span>
          </div>
          <p className="text-sm text-gray-700">{intel.price_impact}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-800 uppercase">Procurement Recommendation</span>
        </div>
        <p className="text-sm text-gray-700">{intel.procurement_rec}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border ${getRiskStyle(intel.risk_level)}`}>
          Risk: {intel.risk_level}
        </div>
        <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold ${getUrgencyStyle(intel.urgency)} flex items-center gap-1`}>
          <Clock className="w-3 h-3" />
          {intel.urgency}
        </div>
      </div>
    </div>
  );
}
