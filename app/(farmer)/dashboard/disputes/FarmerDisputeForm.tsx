'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EligibleTx {
  id: string;
  reference: string;
  buyer: { name: string };
  quantityBags: number;
  totalValue: number;
}

interface Props {
  eligibleTxs: EligibleTx[];
}

const REASONS = [
  'QUANTITY_MISMATCH',
  'QUALITY_REJECTED',
  'PAYMENT_DELAY',
  'BUYER_UNRESPONSIVE',
  'PRICE_CHANGED',
  'OTHER',
] as const;

export default function FarmerDisputeForm({ eligibleTxs }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !reason) {
      setError('Transaction and reason are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: selectedTx, reason, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to open dispute');
      } else {
        // Refresh the page to show the new dispute and refresh the eligible list
        router.refresh();
        setOpen(false);
        setSelectedTx('');
        setReason('');
        setDescription('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-white shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left font-medium text-green-800 hover:underline"
      >
        {open ? '✕ Cancel' : '➕ Open a Dispute'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Transaction selector */}
          <label className="block">
            <span className="text-gray-700">Transaction</span>
            <select
              value={selectedTx}
              onChange={(e) => setSelectedTx(e.target.value)}
            ></select>
            <select
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              onChange={(e) => setSelectedTx(e.target.value)}
            >
              <option value="">-- Select transaction --</option>
              {eligibleTxs.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  {tx.reference} – {tx.buyer.name} – {tx.quantityBags} bags – KSh{' '}
                  {tx.totalValue.toLocaleString()}
                </option>
              ))}
            </select>
          </label>

          {/* Reason dropdown */}
          <label className="block">
            <span className="text-gray-700">Reason</span>
            <select
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">-- Select reason --</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          {/* Optional description */}
          <label className="block">
            <span className="text-gray-700">Description (optional)</span>
            <textarea
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Provide any extra details …"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {/* Error message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </form>
      )}
    </div>
  );
}
