'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Buyer {
  id: string;
  name: string;
  location: string;
  pricePerBag: number;
  capacityBags: number;
  verified: boolean;
  active: boolean;
}

interface Props {
  buyer?: Buyer;
  onClose: () => void;
}

export default function BuyerForm({ buyer, onClose }: Props) {
  const router = useRouter();
  const isEdit = !!buyer;

  const [form, setForm] = useState({
    name:         buyer?.name         ?? '',
    location:     buyer?.location     ?? '',
    pricePerBag:  buyer?.pricePerBag  ?? '',
    capacityBags: buyer?.capacityBags ?? '',
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      name:         form.name.trim(),
      location:     form.location.trim(),
      pricePerBag:  Number(form.pricePerBag),
      capacityBags: Number(form.capacityBags),
    };

    const url    = isEdit ? `/api/admin/buyers/${buyer.id}` : '/api/admin/buyers';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong');
      setLoading(false);
      return;
    }

    setSuccess(isEdit ? '✓ Buyer updated successfully' : '✓ Buyer created successfully');
    setTimeout(() => {
      router.refresh();
      onClose();
    }, 800);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Buyer' : 'Add New Buyer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kitale Millers Ltd"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Kitale Town"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per bag (KSh) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.pricePerBag}
              onChange={(e) => setForm({ ...form, pricePerBag: e.target.value })}
              placeholder="e.g. 2950"
              min="1"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (bags) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.capacityBags}
              onChange={(e) => setForm({ ...form, capacityBags: e.target.value })}
              placeholder="e.g. 5000"
              min="1"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add buyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
