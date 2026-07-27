'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemandModerationButton({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleStatus = async () => {
    setLoading(true);
    const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/demands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) router.refresh();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteDemand = async () => {
    if (!confirm('Are you sure you want to permanently delete this demand?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/demands/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={toggleStatus} 
        disabled={loading}
        className={`text-xs px-2 py-1 rounded ${currentStatus === 'ACTIVE' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
      >
        {currentStatus === 'ACTIVE' ? 'Close' : 'Activate'}
      </button>
      <button 
        onClick={deleteDemand} 
        disabled={loading}
        className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
      >
        Delete
      </button>
    </div>
  );
}
