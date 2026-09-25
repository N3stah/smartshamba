'use client';
import { useEffect, useState } from 'react';
import { Loader2, Truck, CheckCircle, XCircle, Phone, MapPin, Plus, ShieldCheck, Ban, RotateCcw, Car, Search, Edit, Pencil } from 'lucide-react';

interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacityBags: number;
  status: string;
  isActive: boolean;
}

interface Provider {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  contactPerson?: string | null;
  baseLocation?: string | null;
  ratePerKm?: number | null;
  verificationStatus: string;
  active: boolean;
  vehicles: Vehicle[];
}

export default function AdminTransportProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [tempPassword, setTempPassword] = useState('');
  const [vehicleForms, setVehicleForms] = useState<Record<string, boolean>>({});
  const [editingVehicle, setEditingVehicle] = useState<{ providerId: string; vehicle: Vehicle } | null>(null);

  const emptyForm = { name: '', phone: '', email: '', contactPerson: '', baseLocation: '', ratePerKm: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [vehicleData, setVehicleData] = useState<Record<string, { registrationNumber: string; vehicleType: string; capacityBags: string }>>({});

  const fetchProviders = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/transport-providers');
    const data = await res.json();
    setProviders(data.providers || []);
    setLoading(false);
  };

  useEffect(() => { fetchProviders(); }, []);

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/transport-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (res.ok) {
      setTempPassword(data.temporaryPassword);
      setShowForm(false);
      setFormData(emptyForm);
      fetchProviders();
    } else {
      alert(data.error || 'Failed to create provider');
    }
  };

  const handleEditProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    const res = await fetch(`/api/admin/transport-providers/${editingProvider.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setEditingProvider(null);
      setFormData(emptyForm);
      fetchProviders();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to update provider');
    }
  };

  const handleAction = async (id: string, action: string) => {
    const res = await fetch(`/api/admin/transport-providers/${id}/${action}`, { method: 'POST' });
    if (res.ok) fetchProviders();
  };

  const handleAddVehicle = async (e: React.FormEvent, providerId: string) => {
    e.preventDefault();
    const data = vehicleData[providerId];
    if (!data) return;
    const res = await fetch(`/api/admin/transport-providers/${providerId}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setVehicleForms({ ...vehicleForms, [providerId]: false });
      setVehicleData({ ...vehicleData, [providerId]: { registrationNumber: '', vehicleType: '', capacityBags: '' } });
      fetchProviders();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to add vehicle');
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    const res = await fetch(`/api/admin/transport-providers/${editingVehicle.providerId}/vehicles/${editingVehicle.vehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingVehicle.vehicle)
    });
    if (res.ok) {
      setEditingVehicle(null);
      fetchProviders();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to update vehicle');
    }
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || (p.email && p.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.verificationStatus === statusFilter || (statusFilter === 'ACTIVE' && p.active) || (statusFilter === 'SUSPENDED' && !p.active);
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-admin-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Truck className="w-6 h-6 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transport Providers</h1>
            <p className="text-sm text-gray-500">Manage drivers and transport companies</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingProvider(null); setFormData(emptyForm); }} className="bg-admin-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-admin-primary/90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      {tempPassword && (
        <div className="bg-green-50 border border-admin-primary/20 rounded-lg p-4 text-green-800 flex justify-between items-center">
          <div>
            <p className="font-bold">Provider Created Successfully!</p>
            <p className="text-sm mt-1">Temporary Password: <span className="font-mono bg-admin-secondary px-2 py-0.5 rounded">{tempPassword}</span></p>
            <p className="text-xs mt-1 text-green-600">Please share this securely with the provider. It will not be shown again.</p>
          </div>
          <button onClick={() => setTempPassword('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {(showForm || editingProvider) && (
        <form onSubmit={editingProvider ? handleEditProvider : handleCreateProvider} className="bg-surface rounded-lg border border-border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{editingProvider ? `Edit ${editingProvider.name}` : 'Add Transport Provider'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required placeholder="Business Name" defaultValue={editingProvider?.name} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="tel" required placeholder="Phone (+254...)" defaultValue={editingProvider?.phone} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input type="email" placeholder="Email" defaultValue={editingProvider?.email || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="text" placeholder="Contact Person" defaultValue={editingProvider?.contactPerson || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
            <input type="text" placeholder="Base Location" defaultValue={editingProvider?.baseLocation || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" onChange={e => setFormData({...formData, baseLocation: e.target.value})} />
            <input type="number" step="0.01" placeholder="Rate Per Km (KSh)" defaultValue={editingProvider?.ratePerKm || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" onChange={e => setFormData({...formData, ratePerKm: e.target.value})} />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-admin-primary text-white px-4 py-2 rounded-lg text-sm font-medium">{editingProvider ? 'Save Changes' : 'Create Provider'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingProvider(null); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="VERIFIED">Verified</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="grid gap-6">
        {filteredProviders.map(p => (
          <div key={p.id} className="bg-surface rounded-lg border border-border shadow-sm p-6">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.contactPerson || "N/A"} • {p.phone}</p>
                <p className="text-xs text-gray-400">{p.email || "No email"} • {p.baseLocation || "No base location"}</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 mt-2 md:mt-0">
                <div className="flex gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.verificationStatus === 'VERIFIED' ? 'bg-admin-secondary text-admin-primary' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.verificationStatus}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {p.active ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProvider(p); setFormData({ name: p.name, phone: p.phone, email: p.email || '', contactPerson: p.contactPerson || '', baseLocation: p.baseLocation || '', ratePerKm: p.ratePerKm?.toString() || '' }); setShowForm(false); }} className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {p.verificationStatus !== 'VERIFIED' && (
                    <button onClick={() => handleAction(p.id, 'verify')} className="text-xs bg-green-50 text-admin-primary px-2 py-1 rounded border border-admin-primary/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verify
                    </button>
                  )}
                  {p.active ? (
                    <button onClick={() => handleAction(p.id, 'suspend')} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Suspend
                    </button>
                  ) : (
                    <button onClick={() => handleAction(p.id, 'reactivate')} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Car className="w-4 h-4" /> Vehicles</h4>
                <button onClick={() => setVehicleForms({ ...vehicleForms, [p.id]: !vehicleForms[p.id] })} className="text-xs text-admin-primary flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Vehicle
                </button>
              </div>

              {vehicleForms[p.id] && (
                <form onSubmit={(e) => handleAddVehicle(e, p.id)} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input type="text" required placeholder="Reg Number" className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={e => setVehicleData({ ...vehicleData, [p.id]: { ...vehicleData[p.id], registrationNumber: e.target.value } })} />
                  <input type="text" required placeholder="Type (e.g. 10-Tonne)" className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={e => setVehicleData({ ...vehicleData, [p.id]: { ...vehicleData[p.id], vehicleType: e.target.value } })} />
                  <input type="number" required placeholder="Capacity (bags)" className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={e => setVehicleData({ ...vehicleData, [p.id]: { ...vehicleData[p.id], capacityBags: e.target.value } })} />
                  <div className="col-span-full flex gap-2">
                    <button type="submit" className="bg-admin-primary text-white px-3 py-1 rounded text-xs">Save Vehicle</button>
                    <button type="button" onClick={() => setVehicleForms({ ...vehicleForms, [p.id]: false })} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs">Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {p.vehicles.map(v => (
                  <div key={v.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    {editingVehicle?.vehicle.id === v.id ? (
                      <form onSubmit={handleEditVehicle} className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full items-center">
                        <input type="text" defaultValue={v.registrationNumber} onChange={e => setEditingVehicle({ ...editingVehicle, vehicle: { ...editingVehicle.vehicle, registrationNumber: e.target.value } })} className="border rounded px-2 py-1 text-sm" />
                        <input type="text" defaultValue={v.vehicleType} onChange={e => setEditingVehicle({ ...editingVehicle, vehicle: { ...editingVehicle.vehicle, vehicleType: e.target.value } })} className="border rounded px-2 py-1 text-sm" />
                        <input type="number" defaultValue={v.capacityBags} onChange={e => setEditingVehicle({ ...editingVehicle, vehicle: { ...editingVehicle.vehicle, capacityBags: parseInt(e.target.value) } })} className="border rounded px-2 py-1 text-sm" />
                        <div className="flex gap-1">
                          <button type="submit" className="bg-admin-primary text-white px-2 py-1 rounded text-xs">Save</button>
                          <button type="button" onClick={() => setEditingVehicle(null)} className="bg-gray-200 px-2 py-1 rounded text-xs">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-mono font-bold text-gray-900">{v.registrationNumber}</p>
                          <p className="text-xs text-gray-500">{v.vehicleType} • {v.capacityBags} bags</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${v.isActive ? 'bg-admin-secondary text-admin-primary' : 'bg-gray-100 text-gray-600'}`}>
                            {v.isActive ? v.status : 'INACTIVE'}
                          </span>
                          <button onClick={() => setEditingVehicle({ providerId: p.id, vehicle: v })} className="text-xs text-gray-500 hover:text-gray-700"><Pencil className="w-3 h-3" /></button>
                          <button onClick={async () => {
                            const updatedVehicle = { ...v, isActive: !v.isActive, status: !v.isActive ? 'AVAILABLE' : 'MAINTENANCE' };
                            await fetch(`/api/admin/transport-providers/${p.id}/vehicles/${v.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(updatedVehicle)
                            });
                            fetchProviders();
                          }} className={`text-xs px-2 py-0.5 rounded ${v.isActive ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-admin-primary border border-admin-primary/20'}`}>
                            {v.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {p.vehicles.length === 0 && <p className="text-xs text-gray-400 italic">No vehicles assigned.</p>}
              </div>
            </div>
          </div>
        ))}
        {filteredProviders.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No transport providers found.</div>
        )}
      </div>
    </div>
  );
}
