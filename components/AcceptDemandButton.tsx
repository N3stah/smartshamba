'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AcceptDemandButton({ demandId }: { demandId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch(`/api/farmers/demands/${demandId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept demand');
      
      setStatus('success');
      setMessage('Demand accepted! Buyer has been notified.');
      router.refresh(); // Refresh to update demand status in the UI
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return <div className="flex items-center gap-2 text-green-700 text-sm font-medium bg-green-50 p-2 rounded-lg w-full justify-center"><CheckCircle className="w-4 h-4" /> Accepted</div>;
  }

  if (status === 'error') {
    return <div className="flex items-center gap-2 text-red-700 text-sm font-medium bg-red-50 p-2 rounded-lg w-full justify-center"><XCircle className="w-4 h-4" /> {message}</div>;
  }

  return (
    <button 
      onClick={handleAccept} 
      disabled={loading} 
      className="w-full bg-[#00703C] text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept Demand'}
    </button>
  );
}
