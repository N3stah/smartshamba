'use client';

import { useState, useEffect } from 'react';
import BuyerForm from '@/components/admin/BuyerForm';
import BuyerToggle from '@/components/admin/BuyerToggle';

interface Buyer {
  id: string;
  name: string;
  location: string;
  pricePerBag: number;
  capacityBags: number;
  verified: boolean;
  active: boolean;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBuyer, setEditBuyer] = useState<Buyer | undefined>();

  useEffect(() => {
    async function fetchBuyers() {
      try {
        setLoading(true);

        const res = await fetch('/api/buyers', {
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Failed to load buyers');
        }

        const data: Buyer[] = await res.json();
        setBuyers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBuyers();
  }, []);

  async function refreshBuyers() {
    try {
      const res = await fetch('/api/buyers', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to refresh buyers');
      }

      const data: Buyer[] = await res.json();
      setBuyers(data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleEdit(buyer: Buyer) {
    setEditBuyer(buyer);
    setShowForm(true);
  }

  async function handleClose() {
    setShowForm(false);
    setEditBuyer(undefined);
    await refreshBuyers();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {buyers.length} buyer{buyers.length !== 1 ? 's' : ''} registered
          </p>
        </div>

        <button
          onClick={() => {
            setEditBuyer(undefined);
            setShowForm(true);
          }}
          className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Add Buyer
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading buyers...
        </div>
      )}

      {/* Buyers */}
      {!loading && (
        <div className="grid gap-4">
          {buyers.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <p className="text-gray-400 text-sm">
                No buyers yet. Add one to get started.
              </p>
            </div>
          )}

          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              className={`bg-white rounded-xl border shadow-sm p-6 transition-all ${
                buyer.active
                  ? 'border-gray-200'
                  : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Buyer Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {buyer.name}
                    </h2>

                    {buyer.verified && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium border border-green-200">
                        ✓ Verified
                      </span>
                    )}

                    {!buyer.active && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                        Inactive
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-sm mt-1">
                    📍 {buyer.location}
                  </p>

                  <div className="mt-4 flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Price per bag
                      </p>
                      <p className="text-xl font-bold text-green-700 mt-0.5">
                        KSh {buyer.pricePerBag.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Capacity
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-0.5">
                        {buyer.capacityBags.toLocaleString()} bags
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 items-end">
                  <button
                    onClick={() => handleEdit(buyer)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    Edit
                  </button>

                  <BuyerToggle
                    buyerId={buyer.id}
                    active={buyer.active}
                    buyerName={buyer.name}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <BuyerForm
          buyer={editBuyer}
          onClose={handleClose}
        />
      )}
    </div>
  );
}