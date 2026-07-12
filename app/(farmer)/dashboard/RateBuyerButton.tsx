'use client';

import { useState } from 'react';

interface Props {
  transactionId: string;
  buyerName: string;
  existingScore: number | null;
}

export default function RateBuyerButton({
  transactionId,
  buyerName,
  existingScore,
}: Props) {
  const [score, setScore] = useState<number>(existingScore ?? 0);
  const [hovered, setHovered] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(existingScore !== null);
  const [error, setError] = useState('');

  async function handleRate(value: number) {
    if (submitted || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, score: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to submit rating');
      } else {
        setScore(value);
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayStar = (s: number) => {
    if (submitted) {
      // Already rated — display-only
      return s <= score ? 'text-amber-400' : 'text-gray-200';
    }
    // Interactive — highlight on hover, empty if no hover
    if (hovered > 0) {
      return s <= hovered ? 'text-amber-400' : 'text-gray-200';
    }
    return 'text-gray-300';
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            disabled={submitted || submitting}
            onClick={() => handleRate(s)}
            onMouseEnter={() => !submitted && setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className={`text-lg transition-colors ${
              submitted ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } ${displayStar(s)}`}
            aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}

        {submitting && (
          <span className="text-xs text-gray-400 ml-2">Submitting…</span>
        )}

        {submitted && !submitting && (
          <span className="text-xs text-green-600 ml-2 font-medium">
            {existingScore ? 'Rating updated' : `You rated ${buyerName} ${score} ★`}
          </span>
        )}

        {!submitted && !submitting && (
          <span className="text-xs text-gray-400 ml-2">Rate {buyerName}</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}