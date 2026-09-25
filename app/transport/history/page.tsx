'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, History, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

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

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-transport-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Delivery History</h1>
        <p className="text-gray-500 text-sm mt-1">Your completed and cancelled transport jobs.</p>
      </div>
      
      {bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No completed deliveries yet.</p>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-text">#{b.id.substring(0,8)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
                        b.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' : 
                        b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {b.status === 'DELIVERED' || b.status === 'COMPLETED' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-text">KSh {b.cost.toLocaleString()}</td>
                    <td className="p-4 text-xs text-gray-500">{new Date(b.completedAt || b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {bookings.map((b: any) => (
              <Card key={b.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-xs text-gray-500">#{b.id.substring(0,8)}</p>
                    <p className="font-bold text-text mt-1">KSh {b.cost.toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
                    b.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' : 
                    b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 border-t border-border pt-2">{new Date(b.completedAt || b.createdAt).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
