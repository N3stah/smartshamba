'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'green';

  onConfirm: () => void;
  onCancel: () => void;

  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const confirmClass =
    confirmColor === 'red'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-green-700 hover:bg-green-600';

  return (
    <Dialog
      open={open}
      onClose={loading ? () => {} : onCancel}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
      />

      {/* Centered modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>

          <p className="mt-3 text-gray-600">
            {message}
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className={`${confirmClass} rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50`}
            >
              {loading ? 'Please wait...' : confirmText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}