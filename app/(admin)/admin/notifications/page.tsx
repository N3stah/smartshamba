'use client';

import { useCallback, useEffect, useState } from 'react';

type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
type NotificationType =
  | 'TRANSACTION_CONFIRMATION' | 'SETTLEMENT' | 'WEEKLY_MARKET_REPORT'
  | 'HARVEST_ADVISORY' | 'QUALITY_ADVISORY' | 'DISPUTE_UPDATE'
  | 'OTP' | 'GROUP_TRANSACTION';

interface Notification {
  id: string;
  type: NotificationType;
  body: string;
  status: NotificationStatus;
  retries: number;
  sentAt: string | null;
  createdAt: string;
  farmer: { name: string | null; phone: string } | null;
}

interface Stats {
  sent: number;
  failed: number;
  pending: number;
  retrying: number;
  total: number;
}

const STATUS_STYLES: Record<NotificationStatus, string> = {
  SENT:     'bg-green-100 text-green-700',
  FAILED:   'bg-red-100 text-red-700',
  PENDING:  'bg-gray-100 text-gray-600',
  RETRYING: 'bg-amber-100 text-amber-700',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter]   = useState<NotificationStatus | 'ALL'>('ALL');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'ALL'
        ? '/api/admin/notifications'
        : `/api/admin/notifications?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load notifications');
      const data: { notifications: Notification[]; stats: Stats } = await res.json();
      setNotifications(data.notifications);
      setStats(data.stats);
    } catch {
      setError('Failed to load notifications. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deliveryRate = stats && (stats.sent + stats.failed) > 0
    ? Math.round((stats.sent / (stats.sent + stats.failed)) * 100)
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">SMS delivery history and analytics.</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Sent',          value: stats.sent,     color: 'text-green-700' },
            { label: 'Failed',        value: stats.failed,   color: 'text-red-700'   },
            { label: 'Pending',       value: stats.pending,  color: 'text-gray-600'  },
            { label: 'Retrying',      value: stats.retrying, color: 'text-amber-700' },
            { label: 'Delivery Rate', value: deliveryRate !== null ? `${deliveryRate}%` : '—', color: 'text-green-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(['ALL', 'SENT', 'FAILED', 'RETRYING', 'PENDING'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              statusFilter === s
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="px-5 py-3 font-medium text-gray-600">Type</th>
              <th className="px-5 py-3 font-medium text-gray-600">Farmer</th>
              <th className="px-5 py-3 font-medium text-gray-600">Message</th>
              <th className="px-5 py-3 font-medium text-gray-600">Retries</th>
              <th className="px-5 py-3 font-medium text-gray-600">Sent At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading…</td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">No notifications found.</td>
              </tr>
            ) : (
              notifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[n.status]}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {n.type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {n.farmer ? (n.farmer.name ?? n.farmer.phone) : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{n.body}</td>
                  <td className="px-5 py-3 text-center">{n.retries}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {n.sentAt
                      ? new Date(n.sentAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
