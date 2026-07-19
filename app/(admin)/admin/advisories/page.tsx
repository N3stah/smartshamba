'use client';

import { useCallback, useEffect, useState } from 'react';

interface Advisory {
  id: string;
  title: string;
  message: string;
  countyId: string | null;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  county: { name: string } | null;
}

interface County {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  title: '', message: '', countyId: '', startDate: '', endDate: '', active: true,
};

export default function AdminAdvisoriesPage() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [counties, setCounties]     = useState<County[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [showForm, setShowForm]     = useState(false);

  const fetchAdvisories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/advisories');
      if (!res.ok) throw new Error('Failed to load');
      const data: Advisory[] = await res.json();
      setAdvisories(data);
    } catch {
      setError('Failed to load advisories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvisories();
    fetch('/api/counties')
      .then((r) => r.json())
      .then((data: County[]) => setCounties(data))
      .catch(() => {});
  }, [fetchAdvisories]);

  function startEdit(a: Advisory) {
    setEditId(a.id);
    setForm({
      title:     a.title,
      message:   a.message,
      countyId:  a.countyId ?? '',
      startDate: a.startDate.slice(0, 10),
      endDate:   a.endDate.slice(0, 10),
      active:    a.active,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setError(null);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.message.trim() || !form.startDate || !form.endDate) {
      setError('Title, message, start date and end date are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url    = editId ? `/api/advisories/${editId}` : '/api/advisories';
      const method = editId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          countyId: form.countyId || null,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      resetForm();
      await fetchAdvisories();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this advisory? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/advisories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchAdvisories();
    } catch {
      setError('Failed to delete advisory.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advisories</h1>
          <p className="text-sm text-gray-500 mt-1">Publish harvest tips and alerts to farmers via SMS.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            + New Advisory
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            {editId ? 'Edit Advisory' : 'New Advisory'}
          </h2>

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Aflatoxin Prevention Alert"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
              <textarea
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="SMS message body…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">County (leave blank for national)</label>
              <select
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.countyId}
                onChange={(e) => setForm((p) => ({ ...p, countyId: e.target.value }))}
              >
                <option value="">All counties (national)</option>
                {counties.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="active-toggle"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="active-toggle" className="text-sm text-gray-700">Active</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input
                type="date"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
              <input
                type="date"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : editId ? 'Update Advisory' : 'Create Advisory'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Advisories table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 font-medium text-gray-600">Title</th>
              <th className="px-5 py-3 font-medium text-gray-600">County</th>
              <th className="px-5 py-3 font-medium text-gray-600">Active</th>
              <th className="px-5 py-3 font-medium text-gray-600">Start</th>
              <th className="px-5 py-3 font-medium text-gray-600">End</th>
              <th className="px-5 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading…</td></tr>
            ) : advisories.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No advisories yet.</td></tr>
            ) : (
              advisories.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[220px] mt-0.5">{a.message}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{a.county?.name ?? 'National'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(a.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(a.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 space-x-3">
                    <button
                      onClick={() => startEdit(a)}
                      className="text-sm text-green-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
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
