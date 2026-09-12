'use client';
import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';

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
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', location: '', pricePerBag: '', capacityBags: '' });
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pricePerBag: Number(formData.pricePerBag),
          capacityBags: Number(formData.capacityBags)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create buyer');
      } else {
        setBuyers(prev => [data, ...prev]);
        setFormData({ name: '', phone: '', location: '', pricePerBag: '', capacityBags: '' });
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

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


      <div className="mb-6">
        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2 bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00582f] transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add New Buyer
          </button>
        ) : (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Register New Buyer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00703C]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" placeholder="+254712345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00703C]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
                <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00703C]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price Per Bag (KSh) *</label>
                <input type="number" required min="0" value={formData.pricePerBag} onChange={e => setFormData({...formData, pricePerBag: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00703C]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Capacity (Bags) *</label>
                <input type="number" required min="1" value={formData.capacityBags} onChange={e => setFormData({...formData, capacityBags: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00703C]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00582f] transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Buyer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
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
