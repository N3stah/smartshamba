'use client';
import { useEffect, useState } from 'react';
import { Sun, Loader2 } from 'lucide-react';

export default function DailyBriefCard({ role }: { role: 'FARMER' | 'BUYER' | 'ADMIN' }) {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const res = await fetch('/api/ai/brief');
        if (res.ok) {
          const data = await res.json();
          setBrief(data.brief);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchBrief();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 mb-6">
        <Loader2 className="w-5 h-5 animate-spin text-[#00703C]" />
        <p className="text-sm text-gray-500">Generating your AI daily brief...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#00703C] to-[#004d29] rounded-xl shadow-lg p-4 flex items-start gap-3 mb-6 text-white">
      <Sun className="w-6 h-6 flex-shrink-0 mt-1" />
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1">AI Daily Brief</h3>
        <p className="text-sm">{brief}</p>
      </div>
    </div>
  );
}
