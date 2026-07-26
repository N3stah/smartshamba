'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Farmer {
  id: string;
  phone: string;
  name: string | null;
  location: string | null;
  verified: boolean;
  createdAt: string;
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFarmers() {
      try {
        const res = await fetch('/api/farmers', { headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' } });
        if (res.ok) setFarmers(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchFarmers();
  }, []);

  async function handleVerify(id: string, currentStatus: boolean) {
    const res = await fetch(`/api/admin/farmers/${id}/verify`, { method: 'POST' });
    if (res.ok) {
      setFarmers(prev => prev.map(f => f.id === id ? { ...f, verified: !currentStatus } : f));
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
        <p className="text-gray-500 text-sm mt-1">{farmers.length} registered farmers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Farmer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {farmers.map((farmer) => (
              <tr key={farmer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900"><Link href={`/admin/farmers/${farmer.id}`} className="text-[#00703C] hover:underline">{farmer.name ?? <span className="text-gray-400 italic">No name</span>}</Link></td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{farmer.phone}</td>
                <td className="px-4 py-3 text-gray-600">{farmer.location ?? '—'}</td>
                <td className="px-4 py-3">
                  {farmer.verified ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">✓ Verified</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleVerify(farmer.id, farmer.verified)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${farmer.verified ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>
                    {farmer.verified ? 'Unverify' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>}
        {!loading && farmers.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No farmers registered yet.</div>}
      </div>
    </div>
  );
}
