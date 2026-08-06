'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, Package, Loader2, CheckCircle, DollarSign, Camera } from 'lucide-react';

interface Booking {
  id: string;
  status: string;
  cost: number;
  pickupLocation: string;
  dropoffLocation: string;
  transaction: any;
  groupTransaction: any;
}

export default function TransportDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [stats, setStats] = useState({ active: 0, earnings: 0 });
  const [podModal, setPodModal] = useState<string | null>(null);
  const [podName, setPodName] = useState('');
  const router = useRouter();

  useEffect(() => { fetchDeliveries(); }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/transport/deliveries');
      if (res.status === 401) { router.push('/transport/login'); return; }
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
        const earnings = data.reduce((sum: number, b: Booking) => sum + (b.status === 'DELIVERED' ? b.cost : 0), 0);
        setStats({ active: data.length, earnings });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string, podSignature?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/transport/deliveries/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, podSignature, note: podSignature ? `Signed by ${podSignature}` : undefined })
      });
      if (res.ok) {
        setPodModal(null);
        setPodName('');
        fetchDeliveries();
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(''); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[#00703C]" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Active Deliveries</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-300 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Expected Earnings</p>
              <p className="text-2xl font-bold text-green-700 mt-1">KSh {stats.earnings.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No Active Jobs</h3>
          <p className="text-sm text-gray-500 mt-1">When a farmer or buyer books transport with you, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Booking #{b.id.substring(0,8)}</p>
                    <p className="font-bold text-gray-900 text-xl mt-1">KSh {b.cost.toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold h-fit ${
                    b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    b.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Pickup</p>
                      <p className="font-medium text-gray-900">{b.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-50 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Dropoff</p>
                      <p className="font-medium text-gray-900">{b.dropoffLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {b.status === 'PENDING' && (
                    <button onClick={() => updateStatus(b.id, 'ACCEPTED')} disabled={updatingId === b.id} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {updatingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Accept Job
                    </button>
                  )}
                  {b.status === 'ACCEPTED' && (
                    <button onClick={() => updateStatus(b.id, 'LOADED')} disabled={updatingId === b.id} className="flex-1 bg-yellow-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {updatingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} Mark Loaded
                    </button>
                  )}
                  {b.status === 'LOADED' && (
                    <button onClick={() => updateStatus(b.id, 'IN_TRANSIT')} disabled={updatingId === b.id} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {updatingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />} Start Transit
                    </button>
                  )}
                  {b.status === 'IN_TRANSIT' && (
                    <button onClick={() => setPodModal(b.id)} disabled={updatingId === b.id} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" /> Capture Proof of Delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POD Modal */}
      {podModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Proof of Delivery</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the name of the person receiving the goods to confirm delivery.</p>
            <input
              type="text"
              value={podName}
              onChange={(e) => setPodName(e.target.value)}
              placeholder="Receiver's Full Name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setPodModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button 
                onClick={() => updateStatus(podModal, 'DELIVERED', podName)} 
                disabled={updatingId === podModal || !podName.trim()}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {updatingId === podModal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
