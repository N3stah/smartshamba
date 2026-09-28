'use client';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Building } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  houseNumber: string | null;
  size: string | null;
  whatsappLink: string | null;
  whatsappApproved: boolean;
  group: { name: string } | null;
}

interface Group {
  id: string;
  name: string;
}

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', houseNumber: '', size: '', groupId: '', whatsappLink: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [whRes, grpRes] = await Promise.all([
          fetch('/api/admin/warehouses'),
          fetch('/api/admin/groups')
        ]);
        
        if (whRes.ok) setWarehouses(await whRes.json());
        if (grpRes.ok) setGroups(await grpRes.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create warehouse');
      } else {
        setWarehouses(prev => [data, ...prev]);
        setFormData({ name: '', location: '', houseNumber: '', size: '', groupId: '', whatsappLink: '' });
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading warehouses...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Warehouses</h1>
        <p className="text-gray-500 text-sm mt-1">Manage storage facilities linked to farmer groups</p>
      </div>

      <div className="mb-6">
        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2 bg-admin-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-admin-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        ) : (
          <form onSubmit={handleCreate} className="bg-surface rounded-lg border border-border shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-text mb-4">Register New Warehouse</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Linked Group *</label>
                <select 
                  required 
                  value={formData.groupId} 
                  onChange={e => setFormData({...formData, groupId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary bg-white"
                >
                  <option value="">Select Group...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">House Number</label>
                <input type="text" value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                <input type="text" placeholder="e.g. 10x10m" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Link</label>
                <input type="url" placeholder="https://chat.whatsapp.com/..." value={formData.whatsappLink} onChange={e => setFormData({...formData, whatsappLink: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
                <p className="text-xs text-gray-500 mt-1">Subject to admin approval before exposure.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-admin-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-admin-primary/90 transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Warehouse
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="grid gap-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-surface rounded-lg border border-border p-6 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Building className="w-5 h-5 text-admin-primary" />
                  <h2 className="text-lg font-semibold text-text">{wh.name}</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Group: {wh.group?.name ?? 'N/A'} • Location: {wh.location ?? 'N/A'} • Size: {wh.size ?? 'N/A'}
                </p>
                {wh.whatsappLink && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wh.whatsappApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      WhatsApp: {wh.whatsappApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <div className="text-center py-12 text-gray-400">No warehouses found.</div>
        )}
      </div>
    </div>
  );
}
