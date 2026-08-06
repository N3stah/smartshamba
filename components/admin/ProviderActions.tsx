'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ProviderActions({ provider }: { provider: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleVerify = async () => {
    setLoading(true);
    try {
      // We use the generic buyer update endpoint pattern, but for transport we need a dedicated one.
      // For simplicity in this MVP, we will use a direct fetch to a new API route.
      await fetch(`/api/admin/transport-providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !provider.verified })
      });
      router.refresh();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <button 
      onClick={toggleVerify} 
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
        provider.verified 
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
          : 'bg-green-600 text-white hover:bg-green-700'
      } disabled:opacity-50`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : provider.verified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      {provider.verified ? 'Unverify' : 'Verify Provider'}
    </button>
  );
}
