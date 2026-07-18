'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  groupId: string;
  currentPledge: number;
};

export default function UpdatePledgeButton({
  groupId,
  currentPledge,
}: Props) {
  const router = useRouter();

  const [bags, setBags] = useState(currentPledge);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  async function updatePledge() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/groups/${groupId}/pledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bagsPledged: bags,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to update pledge');
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-600 transition"
      >
        Update Pledge
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Bags to pledge
      </label>

      <input
        type="number"
        min={1}
        value={bags}
        onChange={(e) => setBags(Number(e.target.value))}
        className="w-32 rounded-lg border border-gray-300 px-3 py-2"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={updatePledge}
          disabled={loading || bags < 1}
          className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={() => {
            setEditing(false);
            setBags(currentPledge);
            setError('');
          }}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}