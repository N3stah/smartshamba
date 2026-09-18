'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyButton({ farmerId, isVerified }: { farmerId: string; isVerified: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/farmers/${farmerId}/verify`, { method: 'POST' });
      if (res.ok) {
        router.refresh(); // Forces server component to re-fetch and re-render
      } else {
        console.error('Failed to verify farmer');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleVerify} 
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${isVerified ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}
    >
      {loading ? 'Saving...' : (isVerified ? 'Unverify' : 'Verify')}
    </button>
  );
}
