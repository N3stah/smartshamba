'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DemandForm() {
  const [product, setProduct] = useState('Maize');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const res = await fetch('/api/buyers/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, quantityBags: quantity, location }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to post demand');
    else { setSuccess('Demand posted successfully!'); setQuantity(''); setLocation(''); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
        <select value={product} onChange={(e) => setProduct(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400">
          <option>Maize</option>
          <option>Beans</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Bags)</label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location / Delivery Area</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400" />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
      <button type="submit" disabled={loading} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />} Post Demand
      </button>
    </form>
  );
}
