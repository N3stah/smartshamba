'use client';

import { useState } from 'react';

interface Props {
  label: string;
  description: string;
  field: string;
  initialValue: boolean;
}

export default function PreferenceToggle({ label, description, field, initialValue }: Props) {
  const [enabled, setEnabled]   = useState(initialValue);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [field]: next }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      setEnabled(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        aria-pressed={enabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 ${
          enabled ? 'bg-green-600' : 'bg-gray-200'
        }`}
      >
        <span className="sr-only">Toggle {label}</span>
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}