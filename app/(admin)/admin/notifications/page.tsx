'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Building2 } from 'lucide-react';

type NotificationType = 'OTP' | 'TRANSACTION_CONFIRMATION' | 'SETTLEMENT' | 'WEEKLY_MARKET_REPORT' | 'HARVEST_ADVISORY' | 'QUALITY_ADVISORY' | 'DISPUTE_UPDATE' | 'GROUP_TRANSACTION';
type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';

interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  recipientPhone: string;
  body: string;
  createdAt: string;
  farmerId?: string | null;
  buyerId?: string | null;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'FARMER' | 'BUYER'>('ALL');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.notifications || data);
    } catch (error) {
      console.error('[ADMIN] Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await fetchNotifications();
    };
    run();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'FARMER') return n.farmerId;
    if (filter === 'BUYER') return n.buyerId;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications & SMS Logs</h1>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['ALL', 'FARMER', 'BUYER'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as 'ALL' | 'FARMER' | 'BUYER')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab ? 'bg-[#00703C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab === 'FARMER' ? 'Farmers' : 'Buyers'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Type</th>
                <th className="p-4 font-semibold text-gray-600">Recipient</th>
                <th className="p-4 font-semibold text-gray-600">Message</th>
                <th className="p-4 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Loading notifications...</td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">No notifications found.</td>
                </tr>
              ) : (
                filteredNotifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        n.status === 'SENT' ? 'bg-green-100 text-green-800' :
                        n.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        n.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-700">{n.type}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {n.farmerId ? (
                          <span className="flex items-center gap-1 text-[#00703C] bg-green-50 px-2 py-1 rounded text-xs font-bold">
                            <User className="w-3 h-3" /> Farmer
                          </span>
                        ) : n.buyerId ? (
                          <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-bold">
                            <Building2 className="w-3 h-3" /> Buyer
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">System</span>
                        )}
                        <span className="text-xs text-gray-500">{n.recipientPhone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 max-w-md truncate">{n.body}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(n.createdAt).toLocaleString('en-KE')}
                    </td>
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
