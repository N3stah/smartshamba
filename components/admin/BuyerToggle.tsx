'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  buyerId: string;
  active: boolean;
  buyerName: string;
}

export default function BuyerToggle({ buyerId, active, buyerName }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = active ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${buyerName}?`)) return;

    setLoading(true);
    await fetch(`/api/admin/buyers/${buyerId}`, { method: 'PATCH' });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
      } disabled:opacity-50`}
    >
      {loading ? '...' : active ? 'Deactivate' : 'Activate'}
    </button>
  );
}
