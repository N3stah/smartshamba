'use client';
import { useEffect, useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(res => res.ok ? res.json() : [])
      .then(setSubs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-admin-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-admin-secondary rounded-lg">
            <CreditCard className="w-6 h-6 text-admin-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-sm text-gray-500">Monitor STK Push payments and active alerts</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Type</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Price (KSh)</th>
                <th className="p-4 font-semibold text-gray-600">Period</th>
                <th className="p-4 font-semibold text-gray-600">Start Date</th>
                <th className="p-4 font-semibold text-gray-600">Expiry Date</th>
                <th className="p-4 font-semibold text-gray-600">M-PESA Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subs.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No subscriptions found.</td></tr>
              ) : (
                subs.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{s.type.replace(/_/g, ' ')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        s.status === 'ACTIVE' ? 'bg-admin-secondary text-admin-primary' : 
                        s.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{s.priceKsh}</td>
                    <td className="p-4 text-gray-700">{s.billingPeriod || 'N/A'}</td>
                    <td className="p-4 text-xs text-gray-500">{s.startedAt ? new Date(s.startedAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4 text-xs text-gray-500">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4 text-xs font-mono text-gray-700">{s.mpesaRef || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
