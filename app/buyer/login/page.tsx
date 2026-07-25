'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [phone, setPhone]         = useState('');
  const [code, setCode]           = useState('');
  const [step, setStep]           = useState<'phone' | 'code'>('phone');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [message, setMessage]     = useState('');
  const router                    = useRouter();
  const searchParams              = useSearchParams();
  const from                      = searchParams.get('from') ?? '/buyer/dashboard';

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const res  = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role: 'BUYER' }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Failed to send OTP');
      setLoading(false);
      return;
    }

    setMessage('OTP sent to your phone. Enter the 6-digit code below.');
    setStep('code');
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res  = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, role: 'BUYER' }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Invalid code');
      setLoading(false);
      return;
    }

    router.push(from);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-green-800 font-bold text-2xl">SS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SmartShamba</h1>
          <p className="text-green-200 mt-1 text-sm">Buyer Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'phone' ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter the phone number you used to register via USSD.
              </p>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254700000000"
                    required
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: +254XXXXXXXXX</p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Enter OTP</h2>
              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm mb-4">
                  {message}
                </div>
              )}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    autoFocus
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-sm font-mono text-center text-xl tracking-widest"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Verifying...' : 'Sign in →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setCode(''); setError(''); setMessage(''); }}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
                >
                  ← Use a different number
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-green-300 mt-6">
          Not registered? Dial <span className="font-mono font-bold">*384*53374#</span> to register via USSD.
        </p>
      </div>
    </div>
  );
}

export default function BuyerLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
