'use client';
import { useState } from 'react';
import { Loader2, Truck, Package, CheckCircle } from 'lucide-react';

interface Provider { name: string; }
interface Vehicle { registrationNumber: string; }
interface Request { status: string; }
interface Booking { status: string; cost: number; provider?: Provider | null; vehicle?: Vehicle | null; }

export default function ArrangeTransportButton({ transactionId, userRole, existingRequest, existingBooking }: { transactionId: string; userRole: 'FARMER' | 'BUYER'; existingRequest?: Request | null; existingBooking?: Booking | null; }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleArrange = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/transport/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          pickupLocation: 'Farm Location', // Defaulting, can be enhanced with a modal later
          dropoffLocation: 'Buyer Location'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to arrange transport');
      window.location.reload(); // Refresh server component to show new status
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (existingBooking) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-green-800 flex items-center gap-2"><Truck className="w-4 h-4" /> Transport Booked</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${existingBooking.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {existingBooking.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Provider: {existingBooking.provider?.name || 'N/A'}</p>
          <p>Vehicle: {existingBooking.vehicle?.registrationNumber || 'N/A'}</p>
          <p>Cost: KSh {existingBooking.cost?.toLocaleString() || 'N/A'}</p>
        </div>
      </div>
    );
  }

  if (existingRequest) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-800">
          <Package className="w-5 h-5" />
          <span className="font-medium">Transport Requested</span>
          <span className="text-xs text-blue-600 ml-2">Waiting for provider to accept...</span>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">{existingRequest.status}</span>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Logistics</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button 
        onClick={handleArrange} 
        disabled={loading}
        className="w-full bg-[#00703C] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00582f] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        Arrange Transport
      </button>
    </div>
  );
}
