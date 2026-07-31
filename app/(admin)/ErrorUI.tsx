'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react';

export default function ErrorUI({ error, reset, title }: { error: Error; reset: () => void; title: string }) {
  useEffect(() => {
    // Log the error to Sentry for monitoring
    Sentry.captureException(error);
    console.error('Boundary Error:', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-6">
          An unexpected error occurred. Our team has been notified. Please try again or navigate back.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={() => useRouter().back()}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
