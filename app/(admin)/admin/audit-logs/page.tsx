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
  const [filter, setFilter] = useState<string>('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter 
        ? `/api/admin/audit-logs?entityType=${filter}&limit=100`
        : `/api/admin/audit-logs?limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs);
    } catch (err) {
      console.error('[ADMIN]', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-2 text-2xl font-bold text-green-800">Audit Logs</h1>
      <p className="mb-6 text-sm text-gray-500">
        Track all administrative actions and system changes.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Filter by entity (e.g. Transaction, Dispute)"
          className="p-2 border rounded text-sm w-64 focus:ring-1 focus:ring-green-500 outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button 
          onClick={fetchLogs}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
        >
          Apply Filter
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
                  No audit logs found.
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
