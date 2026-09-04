'use client';
import { useRouter } from 'next/navigation';
import { RotateCw, ArrowLeft } from 'lucide-react';

interface ErrorUIProps {
  error: Error;
  reset: () => void;
  title?: string;
}

export default function ErrorUI({ error, reset, title = 'Something went wrong' }: ErrorUIProps) {
  const router = useRouter();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred. Our team has been notified.
          {process.env.NODE_ENV === 'development' && (
            <span className="block mt-2 font-mono text-xs text-red-500">{error.message}</span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={() => router.back()}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
