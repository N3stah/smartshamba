'use client';

import React, { useEffect, useState, useCallback } from 'react';

type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

interface Dispute {
  id: string;
  status: DisputeStatus;
  reason: string;
  description?: string | null;
  adminNotes?: string | null; // Mapped from adminNote in DB
  createdAt: string;
  transaction: {
    reference: string;
    quantityBags: number;
    totalValue: number;
  };
  farmer: {
    name: string | null;
    phone: string;
  };
  buyer: {
    name: string;
    location: string;
  };
}

const STATUS_BADGES: Record<DisputeStatus, string> = {
  OPEN: 'bg-red-100 text-red-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const TABS: Array<{ label: string; value: DisputeStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState<DisputeStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url =
          filter === 'ALL'
            ? '/api/admin/disputes'
            : `/api/admin/disputes?status=${filter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch disputes');
        const data: Dispute[] = await res.json();
        if (!cancelled) setDisputes(data);
      } catch (err) {
        console.error('[DISPUTES]', err);
        if (!cancelled) setError('Failed to load disputes. Try refreshing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey]);

  const handleAction = useCallback(
    async (id: string, newStatus: DisputeStatus) => {
      setSaving(id);
      try {
        const res = await fetch(`/api/admin/disputes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            adminNote: noteInput[id] || undefined, // Use inline note if present
          }),
        });
        if (!res.ok) {
          const err: { error?: string } = await res.json();
          alert(err.error ?? 'Failed to update dispute');
          return;
        }
        setRefreshKey((k) => k + 1);
        setExpandedId(null);
        setNoteInput(prev => { const next = {...prev}; delete next[id]; return next; });
      } catch (err) {
        console.error('[DISPUTES]', err);
        alert('Network error. Please try again.');
      } finally {
        setSaving(null);
      }
    },
    [noteInput]
  );

  const handleAddNote = useCallback(
    async (id: string) => {
      const notes = noteInput[id];
      if (!notes || notes.trim().length === 0) return;
      
      setSaving(`note-${id}`);
      try {
        const res = await fetch(`/api/admin/disputes/${id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });
        if (!res.ok) {
          const err: { error?: string } = await res.json();
          alert(err.error ?? 'Failed to add note');
          return;
        }
        setRefreshKey((k) => k + 1);
        setNoteInput(prev => { const next = {...prev}; delete next[id]; return next; });
      } catch (err) {
        console.error('[DISPUTES]', err);
        alert('Network error. Please try again.');
      } finally {
        setSaving(null);
      }
    },
    [noteInput]
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-2 text-2xl font-bold text-green-800">
        Dispute Management
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Review and resolve farmer-reported transaction issues.
      </p>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              filter === t.value
                ? 'bg-green-600 text-white'
                : 'border bg-white hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
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
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Created</th>
              <th className="p-3 font-medium">Transaction</th>
              <th className="p-3 font-medium">Farmer</th>
              <th className="p-3 font-medium">Buyer</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  Loading disputes…
                </td>
              </tr>
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No disputes found{filter !== 'ALL' ? ` with status ${filter.replace('_', ' ')}` : ''}.
                </td>
              </tr>
            ) : (
              disputes.map((d) => (
                <React.Fragment key={d.id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-medium ${STATUS_BADGES[d.status]}`}
                      >
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3 text-gray-600">
                      {new Date(d.createdAt).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="p-3 font-mono text-xs text-gray-700">
                      {d.transaction.reference}
                    </td>

                    <td className="p-3">
                      {d.farmer.name ?? d.farmer.phone}
                    </td>

                    <td className="p-3">{d.buyer.name}</td>

                    <td className="p-3 text-gray-600">
                      {d.reason.replaceAll('_', ' ')}
                    </td>

                    <td className="space-x-2 p-3">
                      {d.status === 'OPEN' && (
                        <button
                          disabled={saving === d.id}
                          onClick={() => handleAction(d.id, 'UNDER_REVIEW')}
                          className="text-blue-600 hover:underline disabled:opacity-50"
                        >
                          Under Review
                        </button>
                      )}

                      {d.status === 'UNDER_REVIEW' && (
                        <button
                          disabled={saving === d.id}
                          onClick={() => handleAction(d.id, 'RESOLVED')}
                          className="text-green-600 hover:underline disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      )}

                      {d.status === 'RESOLVED' && (
                        <button
                          disabled={saving === d.id}
                          onClick={() => handleAction(d.id, 'CLOSED')}
                          className="text-gray-600 hover:underline disabled:opacity-50"
                        >
                          Close
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedId(expandedId === d.id ? null : d.id)
                        }
                        className="text-gray-500 hover:underline"
                      >
                        {expandedId === d.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>

                  {expandedId === d.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Farmer:</strong>{' '}
                            {d.farmer.name ?? '—'} ({d.farmer.phone})
                          </div>

                          <div>
                            <strong>Buyer:</strong> {d.buyer.name} —{' '}
                            {d.buyer.location}
                          </div>

                          <div>
                            <strong>Reference:</strong>{' '}
                            {d.transaction.reference}
                          </div>

                          <div>
                            <strong>Quantity:</strong>{' '}
                            {d.transaction.quantityBags} bags
                            <br />
                            <strong>Value:</strong> KSh{' '}
                            {d.transaction.totalValue.toLocaleString()}
                          </div>

                          <div className="col-span-2">
                            <strong>Reason:</strong>{' '}
                            {d.reason.replaceAll('_', ' ')}
                          </div>

                          <div className="col-span-2">
                            <strong>Description:</strong>{' '}
                            {d.description ?? '—'}
                          </div>

                          <div className="col-span-2 mt-2 border-t pt-4">
                            <strong>Admin Notes:</strong>
                            <p className="mt-1 mb-2 p-2 bg-white rounded text-gray-700 min-h-[40px] border">
                              {d.adminNotes ?? 'No notes recorded yet.'}
                            </p>
                            
                            <div className="flex gap-2">
                              <textarea
                                className="flex-1 p-2 border rounded text-xs focus:ring-1 focus:ring-green-500 outline-none"
                                placeholder="Add investigation notes here..."
                                value={noteInput[d.id] || ''}
                                onChange={(e) => setNoteInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                              />
                              <button
                                disabled={saving === `note-${d.id}` || !noteInput[d.id]?.trim()}
                                onClick={() => handleAddNote(d.id)}
                                className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 disabled:opacity-50"
                              >
                                {saving === `note-${d.id}` ? 'Saving...' : 'Save Note'}
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Note: Adding a note does not change the dispute status.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
