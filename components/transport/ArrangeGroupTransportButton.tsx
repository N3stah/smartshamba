'use client';
import { useState } from 'react';
import { Loader2, Truck, CheckCircle } from 'lucide-react';

export default function ArrangeGroupTransportButton({ groupTransactionId, userId }: { groupTransactionId: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleArrange = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/transport/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupTransactionId,
          pickupLocation: 'Group Farm Location',
          dropoffLocation: 'Buyer Location'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request transport');
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <p className="text-sm font-medium text-green-800">Group transport requested! Providers will be notified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button 
        onClick={handleArrange} 
        disabled={loading}
        className="w-full bg-[#00703C] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#00582f] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        Arrange Group Transport
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
