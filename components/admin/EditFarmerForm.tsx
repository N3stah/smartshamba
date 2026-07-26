'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, AlertCircle } from 'lucide-react';

interface EditFarmerFormProps {
  farmerId: string;
  initialName: string | null;
  initialPhone: string;
  initialNationalId: string | null;
}

export default function EditFarmerForm({ farmerId, initialName, initialPhone, initialNationalId }: EditFarmerFormProps) {
  const [name, setName] = useState(initialName ?? '');
  const [phone, setPhone] = useState(initialPhone);
  const [nationalId, setNationalId] = useState(initialNationalId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/farmers/${farmerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, nationalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update farmer');
      
      setSuccess(true);
      router.refresh(); // Refresh server component data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900 font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
        <input
          type="text"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          maxLength={8}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900 font-mono"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="text-green-700 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
          Profile updated successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </form>
  );
}
