'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  village: string | null;
  county: string | null;
  ward: string | null;
  createdAt: string;
  createdBy: { name: string | null; phone: string };
  memberCount: number;
  transactionCount: number;
  totalBagsPledged: number;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetch('/api/admin/groups')
      .then((r) => r.json())
      .then((data) => { setGroups(data); setLoading(false); })
      .catch(() => { setError('Failed to load groups.'); setLoading(false); });
  }, []);

  const filtered = groups
    .filter((g) => filter === 'all' || (filter === 'active' ? g.active : !g.active))
    .filter((g) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        (g.county ?? '').toLowerCase().includes(q) ||
        (g.ward ?? '').toLowerCase().includes(q) ||
        (g.village ?? '').toLowerCase().includes(q)
      );
    });

  const stats = {
    total: groups.length,
    active: groups.filter((g) => g.active).length,
    members: groups.reduce((s, g) => s + g.memberCount, 0),
    bags: groups.reduce((s, g) => s + g.totalBagsPledged, 0),
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Farmer Groups</h1>
        <p className="text-sm text-gray-500 mt-1">All cooperative selling groups on the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Groups', value: stats.total, color: 'text-gray-900' },
          { label: 'Active Groups', value: stats.active, color: 'text-green-700' },
          { label: 'Total Members', value: stats.members, color: 'text-blue-700' },
          { label: 'Bags Pledged', value: stats.bags.toLocaleString(), color: 'text-green-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, county, ward or village..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading groups...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">No groups found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags Pledged</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transactions</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{g.name}</p>
                      {g.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{g.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {[g.village, g.ward, g.county].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{g.memberCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{g.totalBagsPledged}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{g.transactionCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        g.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {g.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(g.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/groups/${g.id}`}
                        className="text-xs font-medium text-green-700 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
