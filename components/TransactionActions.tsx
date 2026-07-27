'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Truck, DollarSign, PackageCheck, Calendar, AlertTriangle } from 'lucide-react';

interface Props {
  transactionId: string;
  currentStatus: string;
  userRole: 'FARMER' | 'BUYER' | 'ADMIN';
}

export default function TransactionActions({ transactionId, currentStatus, userRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogisticsForm, setShowLogisticsForm] = useState(false);
  
  // Form state
  const [method, setMethod] = useState('PICKUP');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const router = useRouter();

  const updateStatus = async (newStatus: string, fulfillmentData?: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/transactions/${transactionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, fulfillmentData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      
      setShowLogisticsForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatus('DELIVERY_SCHEDULED', {
      deliveryMethod: method,
      deliveryLocation: location,
      scheduledDate: date ? new Date(date).toISOString() : undefined,
      fulfillmentNotes: notes,
    });
  };

  const Button = ({ onClick, children, color = 'bg-[#00703C]', icon: Icon }: any) => (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${color} text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {children}
    </button>
  );

  if (error) return <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {currentStatus === 'PENDING' && (
          <Button onClick={() => updateStatus('AGREED')} icon={CheckCircle}>Confirm Agreement</Button>
        )}
        
        {currentStatus === 'AGREED' && (
          <Button onClick={() => setShowLogisticsForm(!showLogisticsForm)} color="bg-blue-600" icon={Truck}>
            Schedule Delivery
          </Button>
        )}
        
        {currentStatus === 'DELIVERY_SCHEDULED' && userRole !== 'BUYER' && (
          <Button onClick={() => updateStatus('DELIVERED')} color="bg-purple-600" icon={PackageCheck}>Mark Delivered</Button>
        )}
        
        {currentStatus === 'DELIVERED' && userRole !== 'FARMER' && (
          <Button onClick={() => updateStatus('SETTLING')} color="bg-green-600" icon={DollarSign}>Initiate M-PESA Payment</Button>
        )}
        
        {currentStatus === 'SETTLING' && (
          <div className="text-sm text-orange-700 font-medium bg-orange-50 px-4 py-2 rounded-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing M-PESA Payment...
          </div>
        )}
        
        {currentStatus === 'SETTLED' && (
          <Button onClick={() => updateStatus('CLOSED')} color="bg-gray-600" icon={CheckCircle}>Close Transaction</Button>
        )}
      </div>

      {/* Admin Manual Override for B2C Failures (Sandbox Testing) */}
      {userRole === 'ADMIN' && currentStatus === 'SETTLING' && (
        <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-bold text-red-800">Admin Manual Override</h4>
          </div>
          <p className="text-xs text-red-700 mb-3">If the automated M-PESA B2C fails (common in Sandbox), you can manually mark this transaction as SETTLED to bypass it.</p>
          <Button onClick={() => updateStatus('SETTLED')} color="bg-red-600" icon={CheckCircle}>Force Settle (Admin)</Button>
        </div>
      )}

      {showLogisticsForm && (
        <form onSubmit={handleScheduleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <h4 className="text-sm font-bold text-gray-700">Logistics Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="PICKUP">Buyer Pickup</option>
              <option value="DELIVERY">Farmer Drop-off</option>
            </select>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (e.g. Kitale Town)" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (e.g. Truck Driver Name)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} Confirm Schedule
            </button>
            <button type="button" onClick={() => setShowLogisticsForm(false)} className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
