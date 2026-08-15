'use client';
import { useState, useEffect } from 'react';
import { Loader2, Trophy, Medal, User } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string | null;
  county: string | null;
  trustScore: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'FARMERS' | 'BUYERS'>('FARMERS');
  const [data, setData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?type=${activeTab}`);
        const d = await res.json();
        if (isMounted) {
          setData(d.users || []);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-gray-900">SmartShamba Leaderboard</h1>
          <p className="text-gray-500 mt-2">Recognizing our most trusted and active community members.</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white border rounded-lg p-1 shadow-sm">
            <button 
              onClick={() => setActiveTab('FARMERS')} 
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'FARMERS' ? 'bg-[#00703C] text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Top Farmers
            </button>
            <button 
              onClick={() => setActiveTab('BUYERS')} 
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'BUYERS' ? 'bg-[#00703C] text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Top Buyers
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No data available yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.map((user, i) => (
                <li key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      {i === 0 ? <Medal className="w-6 h-6 text-yellow-500 mx-auto" /> : 
                       i === 1 ? <Medal className="w-6 h-6 text-gray-400 mx-auto" /> : 
                       i === 2 ? <Medal className="w-6 h-6 text-orange-400 mx-auto" /> : 
                       <span className="text-gray-400 font-bold">{i + 1}</span>}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{user.county || 'Kenya'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#00703C]">{user.trustScore}</p>
                    <p className="text-xs text-gray-400">Trust Score</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
