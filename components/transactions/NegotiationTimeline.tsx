'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface Offer {
  id: string;
  actor: string;
  status: string;
  pricePerUnit: number;
  quantity: number;
  terms: string | null;
}

export default function NegotiationTimeline({ transactionId, userRole }: { transactionId: string, userRole: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [terms, setTerms] = useState('');

  const fetchOffers = useCallback(() => {
    fetch(`/api/transactions/${transactionId}/negotiate`)
      .then(r => r.json())
      .then((d: Offer[]) => {
        setOffers(d);
        if (d.length > 0) {
          const latest = d[d.length - 1];
          setPrice(String(latest.pricePerUnit));
          setQty(String(latest.quantity));
        }
        setLoading(false);
      });
  }, [transactionId]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const submitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/transactions/${transactionId}/negotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricePerUnit: price, quantity: qty, terms })
    });
    setShowForm(false);
    fetchOffers();
  };

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  return (
    <div className="bg-white rounded-xl border p-6 mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Negotiation History</h3>
      
      <div className="space-y-4 border-l-2 border-gray-100 ml-2">
        {offers.map((offer) => (
          <div key={offer.id} className={`relative flex ${offer.actor === userRole ? 'justify-end' : 'justify-start'}`}>
            <div className={`absolute w-3 h-3 rounded-full -left-1.75 top-2 ${offer.status === 'ACCEPTED' ? 'bg-green-500' : offer.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <div className={`max-w-xs p-3 rounded-lg shadow-sm border ${offer.actor === userRole ? 'bg-[#00703C] text-white' : 'bg-gray-50 text-gray-900'}`}>
              <p className="text-xs font-bold uppercase mb-1 opacity-80">{offer.actor}</p>
              <p className="font-bold text-lg">KSh {offer.pricePerUnit.toLocaleString()} <span className="text-xs font-normal opacity-80">/ {offer.quantity} bags</span></p>
              {offer.terms && <p className="text-sm italic mt-1 opacity-90">&quot;{offer.terms}&quot;</p>}
              <span className="text-[10px] uppercase mt-2 block font-bold opacity-70">{offer.status}</span>
            </div>
          </div>
        ))}
      </div>

      {offers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No negotiations yet. Start the conversation below.</p>}

      {showForm ? (
        <form onSubmit={submitCounter} className="mt-6 space-y-3 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price per Bag (KSh)" className="border rounded-lg p-2 text-sm" required />
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Quantity (Bags)" className="border rounded-lg p-2 text-sm" required />
          </div>
          <textarea value={terms} onChange={e => setTerms(e.target.value)} placeholder="Terms / Conditions (optional)" className="w-full border rounded-lg p-2 text-sm h-16" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-medium">Submit Offer</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="mt-6 w-full border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-lg text-sm font-medium hover:border-[#00703C] hover:text-[#00703C]">
          + Make a Counter-Offer
        </button>
      )}
    </div>
  );
}
