'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface AuditLog {
  id: string;
  action: string;
  actorType: string;
  actorId: string | null;
  entityType: string;
  entityId: string;
  before: any;
  after: any;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [filterKey, setFilterKey] = useState(0); // Used to force refetch

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (entityType) params.set('entityType', entityType);
        if (action) params.set('action', action);
        
        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        if (!cancelled) setLogs(data.logs);
      } catch (err) {
        console.error('[DISPUTES]', err);
        if (!cancelled) setError('Failed to load audit logs. Try refreshing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filterKey, entityType, action]);

  const handleApplyFilters = () => {
    setFilterKey(k => k + 1); // Trigger useEffect refetch
  };

  const handleClearFilters = () => {
    setEntityType('');
    setAction('');
    setFilterKey(k => k + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-2 text-2xl font-bold text-green-800">Audit Logs</h1>
      <p className="mb-6 text-sm text-gray-500">
        Track all administrative actions and system changes.
      </p>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-end gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Entity Type</label>
          <select 
            value={entityType} 
            onChange={(e) => setEntityType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
          >
            <option value="">All</option>
            <option value="Transaction">Transaction</option>
            <option value="Farmer">Farmer</option>
            <option value="Buyer">Buyer</option>
            <option value="Dispute">Dispute</option>
            <option value="ProduceListing">ProduceListing</option>
            <option value="BuyerDemand">BuyerDemand</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Action Contains</label>
          <input 
            type="text" 
            placeholder="e.g. UPDATE, DELETE, SETTLE" 
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
          />
        </div>

        <button 
          onClick={handleApplyFilters}
          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
        >
          Apply Filters
        </button>
        <button 
          onClick={handleClearFilters}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 font-medium">Timestamp</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Actor</th>
              <th className="p-3 font-medium">Entity</th>
              <th className="p-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Loading logs…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No audit logs found matching your filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-xs text-gray-600">
                    {new Date(log.createdAt).toLocaleString('en-KE')}
                  </td>
                  <td className="p-3 font-mono text-xs font-semibold text-gray-900">
                    {log.action}
                  </td>
                  <td className="p-3 text-xs text-gray-700">
                    {log.actorType} <br/>
                    <span className="text-gray-500">{log.actorId ?? 'System'}</span>
                  </td>
                  <td className="p-3 text-xs">
                    {log.entityType} <br/>
                    <span className="font-mono text-gray-500">{log.entityId.substring(0,8)}...</span>
                  </td>
                  <td className="p-3 text-xs text-gray-600 max-w-xs truncate">
                    {log.after ? JSON.stringify(log.after) : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
