'use client';
import { useState } from 'react';

interface Props {
  buyerId: string;
  active: boolean;
  buyerName: string;
  onSuccess?: (active: boolean) => void;
}

export default function BuyerToggle({ buyerId, active, buyerName, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = active ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} ${buyerName}?`)) return;

    setLoading(true);
    const res = await fetch(`/api/admin/buyers/${buyerId}`, { method: 'PATCH' });
    if (res.ok) {
      onSuccess?.(!active);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        active
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
      }`}
    >
      {loading ? '...' : active ? 'Deactivate' : 'Activate'}
    </button>
  );
}
