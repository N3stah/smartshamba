'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  groupId: string;
};

export default function ConfirmGroupSaleButton({
  groupId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleConfirm() {
    const confirmed = window.confirm(
      'Confirm this group sale?\n\nThis will create a group transaction for all pledged maize.'
    );

    if (!confirmed) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/groups/${groupId}/transact`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Unable to confirm group sale.');
        return;
      }

      setSuccess(
        data.message ?? 'Group sale confirmed successfully.'
      );

      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="rounded-lg bg-amber-600 px-5 py-3 text-white font-medium hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
      >
        {loading ? 'Confirming Sale...' : 'Confirm Group Sale'}
      </button>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}