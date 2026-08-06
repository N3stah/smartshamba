'use client';
import { useState, useEffect } from 'react';
import { Truck, Loader2, CheckCircle, MapPin, Package, Sparkles, AlertTriangle } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  vehicleType: string;
  capacityKg: number;
  ratePerKm: number;
  location: string;
}

interface AIRecommendation {
  recommended_provider: string;
  reason: string;
  eta_hours: number;
  risk_warning: string;
}

export default function TransportBooking({ transactionId, bags, pickupCounty, dropoffCounty }: { 
  transactionId: string; 
  bags: number;
  pickupCounty: string;
  dropoffCounty: string;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookedProvider, setBookedProvider] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Fetch providers and AI recommendation
    fetch(`/api/transport/providers?bags=${bags}&county=${encodeURIComponent(pickupCounty)}&dropoff=${encodeURIComponent(dropoffCounty)}`)
      .then(res => res.ok ? res.json() : { providers: [] })
      .then(data => {
        setProviders(data.providers || []);
        setAiRec(data.aiRecommendation || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bags, pickupCounty, dropoffCounty]);

  const handleBook = async (providerId: string) => {
    setBookingStatus('loading');
    try {
      const res = await fetch('/api/transport/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, providerId })
      });
      if (res.ok) {
        setBookedProvider(providerId);
        setBookingStatus('success');
      } else {
        throw new Error('Booking failed');
      }
    } catch (err) {
      setBookingStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (bookedProvider || bookingStatus === 'success') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-[#00703C]" />
          <h3 className="font-bold text-gray-900">Transport Booked Successfully</h3>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Your transport request has been sent!</p>
            <p className="text-xs text-green-700 mt-1">The provider will accept the job shortly. You will receive an SMS update.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-[#00703C]" />
        <h3 className="font-bold text-gray-900">Book Transport</h3>
      </div>

      {/* AI Recommendation */}
      {aiRec && (
        <div className="bg-gradient-to-br from-[#00703C] to-[#004d29] rounded-xl p-4 mb-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider">AI Optimizer</h4>
          </div>
          <p className="text-sm mb-2"><span className="font-bold">Recommended:</span> {aiRec.recommended_provider}</p>
          <p className="text-xs text-green-100 italic mb-2">"{aiRec.reason}"</p>
          <div className="flex items-center gap-4 text-xs">
            <span>ETA: ~{aiRec.eta_hours} hours</span>
            {aiRec.risk_warning !== 'None' && (
              <span className="flex items-center gap-1 text-yellow-300">
                <AlertTriangle className="w-3 h-3" /> {aiRec.risk_warning}
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {providers.map(provider => (
          <div key={provider.id} className={`border rounded-lg p-4 transition-colors ${aiRec?.recommended_provider === provider.name ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-green-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  {provider.name}
                  {aiRec?.recommended_provider === provider.name && <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full">AI PICK</span>}
                </p>
                <p className="text-xs text-gray-500">{provider.vehicleType} • {provider.capacityKg}kg</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {provider.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Rate</p>
                <p className="font-bold text-gray-900">KSh {provider.ratePerKm}/km</p>
              </div>
            </div>
            <button
              onClick={() => handleBook(provider.id)}
              disabled={bookingStatus === 'loading'}
              className="w-full bg-[#00703C] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#00582f] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {bookingStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Book Now
            </button>
          </div>
        ))}
        {providers.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">No transport providers available. Please check back later.</p>
        )}
      </div>
    </div>
  );
}
