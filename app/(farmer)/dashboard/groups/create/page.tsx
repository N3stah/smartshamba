'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateGroupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [village, setVillage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError('');

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        village,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Unable to create group');
      setLoading(false);
      return;
    }

    router.push(`/dashboard/groups/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        Create Farmer Group
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border shadow-sm p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Group Name
          </label>

          <input
            className="w-full border rounded-lg px-4 py-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>

          <textarea
            className="w-full border rounded-lg px-4 py-3"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Village
          </label>

          <input
            className="w-full border rounded-lg px-4 py-3"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  );
}