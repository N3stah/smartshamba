'use client';
import { useState, useEffect, useMemo } from 'react';

interface Buyer {
  id: string;
  name: string;
  phone: string | null;
  location: string;
  pricePerBag: number;
  capacityBags: number;
  verified: boolean;
  active: boolean;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBuyers() {
      try {
        const res = await fetch('/api/admin/buyers');
        if (res.ok) setBuyers(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchBuyers();
  }, []);

  async function handleVerify(id: string, currentStatus: boolean) {
    const res = await fetch(`/api/admin/buyers/${id}/verify`, { method: 'POST' });
    if (res.ok) {
      setBuyers(prev => prev.map(b => b.id === id ? { ...b, verified: !currentStatus } : b));
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading buyers...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buyers</h1>
        <p className="text-gray-500 text-sm mt-1">Manage verified grain buyers</p>
      </div>

      <div className="grid gap-4">
        {buyers.map((buyer) => (
          <div key={buyer.id} className={`bg-white rounded-xl border shadow-sm p-6 transition-all ${buyer.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-900">{buyer.name}</h2>
                  {buyer.verified && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified</span>}
                  {!buyer.active && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                </div>
                <p className="text-gray-500 text-sm mt-1">📍 {buyer.location}</p>
                <p className="text-gray-500 text-sm mt-1">📞 {buyer.phone ?? 'N/A'}</p>
                <div className="mt-4 flex gap-8">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Price per bag</p>
                    <p className="text-2xl font-bold text-green-700">KSh {buyer.pricePerBag.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Capacity</p>
                    <p className="text-2xl font-bold text-gray-900">{buyer.capacityBags.toLocaleString()} bags</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                <button onClick={() => handleVerify(buyer.id, buyer.verified)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${buyer.verified ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>
                  {buyer.verified ? 'Unverify' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
