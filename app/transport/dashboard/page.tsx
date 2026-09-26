'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, Package, Loader2, CheckCircle, Camera, XCircle, Car } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-transport-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Transport Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your transport requests and active deliveries.</p>
      </div>

      {/* Available Requests Section */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-transport-route" /> Available Requests ({requests.length})</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No new transport requests available.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="border border-border rounded-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-mono">Ref: {req.transaction?.reference || req.groupTransaction?.reference || 'N/A'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-medium text-text flex items-center gap-1"><MapPin className="w-4 h-4 text-transport-route" /> {req.pickupLocation}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-sm font-medium text-text flex items-center gap-1"><Package className="w-4 h-4 text-transport-primary" /> {req.dropoffLocation}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{req.quantityBags} bags</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={() => setAcceptModal(req.id)} disabled={updatingId === req.id} className="flex-1 md:flex-none">Accept request</Button>
                  <Button onClick={() => handleDecline(req.id)} disabled={updatingId === req.id} variant="outline" className="flex-1 md:flex-none">Decline request</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Trips Section */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-transport-primary" /> Active Trips ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No active trips.</p>
        ) : (
          <div className="grid gap-4">
            {bookings.map(b => (
              <div key={b.id} className="border border-border rounded-md p-4">
                <div className="flex justify-between mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Booking #{b.id.substring(0,8)}</p>
                    <p className="font-bold text-text text-lg mt-1">KSh {b.cost.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Vehicle: {b.vehicle?.registrationNumber || 'N/A'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold h-fit border ${
                    b.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    b.status === 'IN_TRANSIT' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div><p className="text-xs text-gray-500 uppercase">Pickup</p><p className="font-medium text-text">{b.pickupLocation}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Dropoff</p><p className="font-medium text-text">{b.dropoffLocation}</p></div>
                </div>
                <div className="flex gap-2">
                  {b.status === 'ACCEPTED' && (
                    <button onClick={() => updateStatus(b.id, 'LOADED')} disabled={updatingId === b.id} className="flex-1 bg-yellow-500 text-white py-2.5 rounded-md text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {updatingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} Mark loaded
                    </button>
                  )}
                  {b.status === 'LOADED' && (
                    <button onClick={() => updateStatus(b.id, 'IN_TRANSIT')} disabled={updatingId === b.id} className="flex-1 bg-transport-route text-white py-2.5 rounded-md text-sm font-semibold hover:bg-transport-route/90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {updatingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />} Start transit
                    </button>
                  )}
                  {b.status === 'IN_TRANSIT' && (
                    <button onClick={() => setPodModal(b.id)} disabled={updatingId === b.id} className="flex-1 bg-green-600 text-white py-2.5 rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" /> Record proof of delivery
                    </button>
                  )}
                  {b.status === 'DELIVERED' && (
                    <button onClick={() => updateStatus(b.id, 'COMPLETED')} disabled={updatingId === b.id} className="flex-1 bg-transport-primary text-white py-2.5 rounded-md text-sm font-semibold hover:bg-transport-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Mark completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Accept Modal (Select Vehicle) */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-text mb-4">Select Vehicle</h3>
            {vehicles.length === 0 ? (
              <p className="text-sm text-red-600 mb-4">No active vehicles available. Please contact admin to activate a vehicle.</p>
            ) : (
              <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4 text-text focus:ring-transport-primary focus:border-transport-primary">
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.vehicleType}) - {v.capacityBags} bags</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <Button onClick={() => setAcceptModal(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={() => handleAccept(acceptModal)} disabled={!selectedVehicle || updatingId === acceptModal} className="flex-1">
                {updatingId === acceptModal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm accept'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* POD Modal */}
      {podModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-text mb-4">Proof of Delivery</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the name of the person receiving the goods to confirm delivery.</p>
            <input type="text" value={podName} onChange={e => setPodName(e.target.value)} placeholder="Receiver's Full Name" className="w-full border border-border rounded-md px-4 py-2 text-sm text-text mb-4 focus:ring-transport-primary focus:border-transport-primary" />
            <div className="flex gap-2">
              <Button onClick={() => setPodModal(null)} variant="outline" className="flex-1">Cancel</Button>
              <button onClick={() => updateStatus(podModal, 'DELIVERED', podName)} disabled={updatingId === podModal || !podName.trim()} className="flex-1 bg-green-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {updatingId === podModal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm delivery'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
