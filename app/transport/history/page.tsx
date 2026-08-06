'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, History, CheckCircle, XCircle } from 'lucide-react';

export default function TransportHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/transport/history')
      .then(res => { if (res.status === 401) router.push('/transport/login'); return res.json(); })
      .then(data => setBookings(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[#00703C]" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>No completed deliveries yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Booking ID</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Earnings</th>
                <th className="p-4 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs text-gray-700">#{b.id.substring(0,8)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${b.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {b.status === 'DELIVERED' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">KSh {b.cost.toLocaleString()}</td>
                  <td className="p-4 text-xs text-gray-500">{new Date(b.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
