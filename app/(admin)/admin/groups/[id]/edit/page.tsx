/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type County = {
  id: string;
  name: string;
};

type Ward = {
  id: string;
  name: string;
};

export default function EditGroupPage() {
  const params = useParams();
  const router = useRouter();

  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [counties, setCounties] = useState<County[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [village, setVillage] = useState('');

  const [countyId, setCountyId] = useState('');
  const [wardId, setWardId] = useState('');

  const [active, setActive] = useState(true);

  const loadGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`);

      if (!res.ok) {
        throw new Error('Failed to load group');
      }

      const group = await res.json();

      setName(group.name ?? '');
      setDescription(group.description ?? '');
      setVillage(group.village ?? '');
      setCountyId(group.countyId ?? '');
      setWardId(group.wardId ?? '');
      setActive(group.active ?? true);
    } catch {
      setError('Unable to load group.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadCounties = useCallback(async () => {
    try {
      const res = await fetch('/api/counties');

      if (!res.ok) return;

      const data = await res.json();

      setCounties(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadWards = useCallback(async (county: string) => {
    try {
      const res = await fetch(`/api/counties/${county}/wards`);

      if (!res.ok) return;

      const data = await res.json();

      setWards(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadGroup();
    loadCounties();
  }, [loadGroup, loadCounties]);

  useEffect(() => {
    if (countyId) {
      loadWards(countyId);
    } else {
      setWards([]);
      setWardId('');
    }
  }, [countyId, loadWards]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          village,
          countyId,
          wardId,
          active,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to update group');
        setSaving(false);
        return;
      }

      router.push(`/admin/groups/${groupId}`);
      router.refresh();
    } catch {
      setError('Failed to update group');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold">
        Edit Farmer Group
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Group Name
          </label>

          <input
            className="w-full rounded-lg border px-4 py-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Description
          </label>

          <textarea
            rows={4}
            className="w-full rounded-lg border px-4 py-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Village
          </label>

          <input
            className="w-full rounded-lg border px-4 py-3"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              County
            </label>

            <select
              className="w-full rounded-lg border px-4 py-3"
              value={countyId}
              onChange={(e) => setCountyId(e.target.value)}
            >
              <option value="">Select County</option>

              {counties.map((county) => (
                <option
                  key={county.id}
                  value={county.id}
                >
                  {county.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Ward
            </label>

            <select
              className="w-full rounded-lg border px-4 py-3"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
            >
              <option value="">Select Ward</option>

              {wards.map((ward) => (
                <option
                  key={ward.id}
                  value={ward.id}
                >
                  {ward.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />

          <label
            htmlFor="active"
            className="text-sm"
          >
            Group is Active
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green-700 px-6 py-3 text-white hover:bg-green-600 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border px-6 py-3 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}