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

    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          village: village.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Unable to create group.');
        setLoading(false);
        return;
      }

      router.push(`/dashboard/groups/${data.id}`);
      router.refresh();
    } catch {
      setError('Unable to reach the server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Farmer Group
        </h1>

        <p className="text-gray-500 mt-2">
          Create a local farmer group so members can combine harvests,
          negotiate better prices and sell maize together.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>

          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Turbo Farmers Cooperative"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>

          <textarea
            rows={4}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your farmer group..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Village
          </label>

          <input
            type="text"
            maxLength={100}
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Village (optional)"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || name.trim().length === 0}
            className="rounded-lg bg-green-700 px-6 py-3 font-medium text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? 'Creating Group...' : 'Create Group'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}