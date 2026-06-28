'use client';
import { useState, useEffect, useMemo } from 'react';
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

type Filter = 'all' | 'active' | 'inactive';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-48" />
          <div className="h-3 bg-gray-100 rounded w-32" />
          <div className="flex gap-6 mt-4">
            <div className="h-8 bg-gray-100 rounded w-24" />
            <div className="h-8 bg-gray-100 rounded w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-7 bg-gray-100 rounded w-16" />
          <div className="h-7 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export default function BuyersPage() {
  const [buyers, setBuyers]       = useState<Buyer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editBuyer, setEditBuyer] = useState<Buyer | undefined>();
  const [filter, setFilter]       = useState<Filter>('all');
  const [search, setSearch]       = useState('');

  useEffect(() => {
  async function fetchBuyers() {
    try {
      setLoading(true);

      const res = await fetch('/api/admin/buyers', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to load buyers');
      }

      const data = await res.json();
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
  const res = await fetch('/api/admin/buyers', {
    cache: 'no-store',
  });

  if (res.ok) {
    setBuyers(await res.json());
  }
}

  const filtered = useMemo(() => {
    return buyers
      .filter((b) => {
        if (filter === 'active')   return b.active;
        if (filter === 'inactive') return !b.active;
        return true;
      })
      .filter((b) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q);
      });
  }, [buyers, filter, search]);

  const stats = useMemo(() => ({
    total:    buyers.length,
    active:   buyers.filter((b) => b.active).length,
    inactive: buyers.filter((b) => !b.active).length,
    verified: buyers.filter((b) => b.verified).length,
  }), [buyers]);

  function handleEdit(buyer: Buyer) {
    setEditBuyer(buyer);
    setShowForm(true);
  }

  async function handleClose() {
    setShowForm(false);
    setEditBuyer(undefined);
    await refreshBuyers();
  }

  function handleStatusChange(id: string, active: boolean) {
    setBuyers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active } : b))
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage verified grain buyers for the pilot
          </p>
        </div>
        <button
          onClick={() => { setEditBuyer(undefined); setShowForm(true); }}
          className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Add Buyer
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Buyers',    value: stats.total,    color: 'text-gray-900' },
          { label: 'Active Buyers',   value: stats.active,   color: 'text-green-700' },
          { label: 'Inactive Buyers', value: stats.inactive, color: 'text-gray-400' },
          { label: 'Verified',        value: stats.verified, color: 'text-blue-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or location..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
          {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-green-700 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-gray-700 font-semibold">
            {search || filter !== 'all' ? 'No buyers match your filter' : 'No buyers yet'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Add your first buyer to get started'}
          </p>
          {!search && filter === 'all' && (
            <button
              onClick={() => { setEditBuyer(undefined); setShowForm(true); }}
              className="mt-4 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              + Add First Buyer
            </button>
          )}
        </div>
      )}

      {/* Buyers list */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4">
          {filtered.map((buyer) => (
            <div
              key={buyer.id}
              className={`bg-white rounded-xl border shadow-sm p-6 transition-all ${
                buyer.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-900">{buyer.name}</h2>
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
                  <p className="text-gray-500 text-sm mt-1">📍 {buyer.location}</p>
                  <div className="mt-4 flex gap-8">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Price per bag</p>
                      <p className="text-2xl font-bold text-green-700 mt-0.5">
                        KSh {buyer.pricePerBag.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Capacity</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">
                        {buyer.capacityBags.toLocaleString()} bags
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
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
                    onSuccess={(active) => handleStatusChange(buyer.id, active)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <BuyerForm buyer={editBuyer} onClose={handleClose} />
      )}
    </div>
  );
}
