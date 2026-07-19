'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  transactionId: string;
  transactionRef: string;
}

const MOISTURE_OPTIONS = [
  'Very dry (well dried, ready for storage)',
  'Dry (acceptable moisture level)',
  'Slightly damp (may need more drying)',
  'Wet (needs significant drying)',
];

const COLOUR_OPTIONS = [
  'Bright yellow (premium quality)',
  'Yellow (good quality)',
  'Pale yellow (acceptable)',
  'Discoloured / darkened',
];

const BROKEN_OPTIONS = [
  'Less than 2% broken grains',
  '2–5% broken grains',
  '5–10% broken grains',
  'More than 10% broken grains',
];

const FOREIGN_OPTIONS = [
  'No foreign matter',
  'Minimal (dust only)',
  'Some (small stones / chaff)',
  'Significant foreign matter',
];

export default function QualityAssessmentForm({ transactionId, transactionRef }: Props) {
  const router = useRouter();
  const [open, setOpen]                     = useState(false);
  const [moistureAnswer, setMoistureAnswer] = useState('');
  const [grainColour, setGrainColour]       = useState('');
  const [brokenGrain, setBrokenGrain]       = useState('');
  const [foreignMatter, setForeignMatter]   = useState('');
  const [notes, setNotes]                   = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [done, setDone]                     = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/quality-assessment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          moistureAnswer: moistureAnswer || undefined,
          grainColour:    grainColour    || undefined,
          brokenGrain:    brokenGrain    || undefined,
          foreignMatter:  foreignMatter  || undefined,
          notes:          notes          || undefined,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? 'Failed to submit');
      }
      setDone(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="text-xs text-green-700 font-medium mt-1">
        ✓ Quality info submitted
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-blue-600 hover:underline font-medium"
      >
        + Add quality info
      </button>
    );
  }

  return (
    <div className="mt-3 bg-gray-50 rounded-xl border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-1">
        Quality Assessment
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        Ref: {transactionRef} — all fields optional
      </p>

      {error && (
        <div className="mb-3 rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {([
          { label: 'Moisture level',   value: moistureAnswer, setter: setMoistureAnswer, options: MOISTURE_OPTIONS },
          { label: 'Grain colour',     value: grainColour,    setter: setGrainColour,    options: COLOUR_OPTIONS  },
          { label: 'Broken grains',    value: brokenGrain,    setter: setBrokenGrain,    options: BROKEN_OPTIONS  },
          { label: 'Foreign matter',   value: foreignMatter,  setter: setForeignMatter,  options: FOREIGN_OPTIONS },
        ] as const).map((field) => (
          <div key={field.label}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
            <select
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
            >
              <option value="">Select…</option>
              {field.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Additional notes</label>
          <textarea
            rows={2}
            placeholder="Any other observations about the maize quality…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); }}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
