'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, Package, Loader2, CheckCircle, DollarSign, Camera, XCircle, Car } from 'lucide-react';

interface Request {
  id: string;
  quantityBags: number;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  transaction?: { reference: string };
  groupTransaction?: { reference: string };
}

interface Booking {
  id: string;
  status: string;
  cost: number;
  pickupLocation: string;
  dropoffLocation: string;
  vehicle?: { registrationNumber: string };
  transaction?: { reference: string };
  groupTransaction?: { reference: string };
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacityBags: number;
  status: string;
}

export default function TransportDashboardPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [acceptModal, setAcceptModal] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [podModal, setPodModal] = useState<string | null>(null);
  const [podName, setPodName] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [reqRes, delRes, vehRes] = await Promise.all([
        fetch('/api/transport/requests'),
        fetch('/api/transport/deliveries'),
        fetch('/api/transport/vehicles')
      ]);

      if (reqRes.status === 401 || delRes.status === 401 || vehRes.status === 401) {
        router.push('/transport/login');
        return;
      }

      const reqData = await reqRes.json();
      const delData = await delRes.json();
      const vehData = await vehRes.json();

      setRequests(reqData.requests || []);
      setBookings(delData || []);
      setVehicles(vehData.vehicles || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (requestId: string) => {
    setUpdatingId(requestId);
    try {
      const res = await fetch(`/api/transport/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: selectedVehicle })
      });
      if (res.ok) {
        setAcceptModal(null);
        setSelectedVehicle('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to accept request');
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(''); }
  };

  const handleDecline = async (requestId: string) => {
    setUpdatingId(requestId);
    try {
      await fetch(`/api/transport/requests/${requestId}/decline`, { method: 'POST' });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setUpdatingId(''); }
  };

  const updateStatus = async (id: string, status: string, podSignature?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/transport/deliveries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: podSignature ? `Signed by ${podSignature}` : undefined })
      });
      if (res.ok) {
        setPodModal(null);
        setPodName('');
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(''); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[#00703C]" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transport Dashboard</h1>

      {/* Available Requests Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" /> Available Requests ({requests.length})</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No new transport requests available.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="border border-gray-100 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Ref: {req.transaction?.reference || req.groupTransaction?.reference || 'N/A'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-500" /> {req.pickupLocation}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1"><Package className="w-4 h-4 text-green-500" /> {req.dropoffLocation}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{req.quantityBags} bags</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => setAcceptModal(req.id)} disabled={updatingId === req.id} className="flex-1 md:flex-none bg-[#00703C] text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-[#00582f] disabled:opacity-50">Accept</button>
                  <button onClick={() => handleDecline(req.id)} disabled={updatingId === req.id} className="flex-1 md:flex-none bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-gray-200 disabled:opacity-50">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Trips Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-orange-600" /> Active Trips ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No active trips.</p>
        ) : (
          <div className="grid gap-4">
            {bookings.map(b => (
              <div key={b.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Booking #{b.id.substring(0,8)}</p>
                    <p className="font-bold text-gray-900 text-lg mt-1">KSh {b.cost.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Vehicle: {b.vehicle?.registrationNumber || 'N/A'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold h-fit ${b.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' : b.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div><p className="text-xs text-gray-500 uppercase">Pickup</p><p className="font-medium text-gray-900">{b.pickupLocation}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Dropoff</p><p className="font-medium text-gray-900">{b.dropoffLocation}</p></div>
                </div>
                <div className="flex gap-2">
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
                      <Camera className="w-4 h-4" /> Capture POD
                    </button>
                  )}
                  {b.status === 'DELIVERED' && (
                    <button onClick={() => updateStatus(b.id, 'COMPLETED')} disabled={updatingId === b.id} className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accept Modal (Select Vehicle) */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Vehicle</h3>
            {vehicles.length === 0 ? (
              <p className="text-sm text-red-500 mb-4">No active vehicles available. Please contact admin to activate a vehicle.</p>
            ) : (
              <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4">
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.vehicleType}) - {v.capacityBags} bags</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <button onClick={() => setAcceptModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleAccept(acceptModal)} disabled={!selectedVehicle || updatingId === acceptModal} className="flex-1 bg-[#00703C] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#00582f] disabled:opacity-50">
                {updatingId === acceptModal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POD Modal */}
      {podModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Proof of Delivery</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the name of the person receiving the goods to confirm delivery.</p>
            <input type="text" value={podName} onChange={e => setPodName(e.target.value)} placeholder="Receiver's Full Name" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setPodModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={() => updateStatus(podModal, 'DELIVERED', podName)} disabled={updatingId === podModal || !podName.trim()} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {updatingId === podModal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
