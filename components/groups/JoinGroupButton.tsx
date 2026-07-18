'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  groupId: string;
};

export default function JoinGroupButton({ groupId }: Props) {
  const router = useRouter();

  const [bagsPledged, setBagsPledged] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bagsPledged,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Unable to join group');
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-600 transition-colors"
      >
        Join Group
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm w-full max-w-sm">
      <h3 className="font-semibold text-gray-900 mb-3">
        Join this Group
      </h3>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        Bags to pledge
      </label>

      <input
        type="number"
        min={1}
        max={500}
        value={bagsPledged}
        onChange={(e) =>
          setBagsPledged(Number(e.target.value))
        }
        className="w-full rounded-lg border border-gray-300 px-4 py-3 mb-4"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleJoin}
          disabled={loading}
          className="flex-1 rounded-lg bg-green-700 px-4 py-3 font-medium text-white hover:bg-green-600 disabled:bg-gray-300"
        >
          {loading ? 'Joining...' : 'Join'}
        </button>

        <button
          onClick={() => {
            setShowForm(false);
            setError('');
          }}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-3 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}