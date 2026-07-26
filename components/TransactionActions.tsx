'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Truck, DollarSign, PackageCheck } from 'lucide-react';

interface Props {
  transactionId: string;
  currentStatus: string;
  userRole: 'FARMER' | 'BUYER' | 'ADMIN';
}

export default function TransactionActions({ transactionId, currentStatus, userRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  if (error) return <div className="text-red-500 text-sm mb-4">{error}</div>;

  return (
    <div className="flex flex-wrap gap-3">
      {currentStatus === 'PENDING' && (
        <Button onClick={() => updateStatus('AGREED')} icon={CheckCircle}>Confirm Agreement</Button>
      )}
      
      {currentStatus === 'AGREED' && (
        <Button onClick={() => updateStatus('DELIVERY_SCHEDULED')} color="bg-blue-600" icon={Truck}>Schedule Delivery</Button>
      )}
      
      {currentStatus === 'DELIVERY_SCHEDULED' && userRole !== 'BUYER' && (
        <Button onClick={() => updateStatus('DELIVERED')} color="bg-purple-600" icon={PackageCheck}>Mark Delivered</Button>
      )}
      
      {currentStatus === 'DELIVERED' && userRole !== 'FARMER' && (
        <Button onClick={() => updateStatus('SETTLED')} color="bg-green-600" icon={DollarSign}>Confirm Payment</Button>
      )}
      
      {currentStatus === 'SETTLED' && (
        <Button onClick={() => updateStatus('CLOSED')} color="bg-gray-600" icon={CheckCircle}>Close Transaction</Button>
      )}
    </div>
  );
}
