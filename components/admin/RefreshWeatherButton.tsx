'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';

export default function RefreshWeatherButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    setMessage('Fetching latest weather & AI advisories...');
    try {
      // Call the cron API directly
      const res = await fetch(`/api/cron/weather-refresh?secret=${process.env.NEXT_PUBLIC_CRON_SECRET || 'zxcvbnmasdfghjklqwertyuiop'}`);
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Weather refreshed successfully!');
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to refresh');
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button 
        onClick={handleRefresh} 
        disabled={loading}
        className="bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00582f] flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Refresh Weather
      </button>
      {message && <p className="text-xs text-gray-500">{message}</p>}
    </div>
  );
}
