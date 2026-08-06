'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Truck, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/transport/dashboard';

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/transport/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, role: 'TRANSPORT' })
      });
      const data = await res.json();
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Truck className="w-12 h-12 text-[#00703C]" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Transport Provider Portal</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}
          
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button onClick={() => setMode('otp')} className={`w-1/2 pb-2 text-sm font-medium ${mode === 'otp' ? 'text-[#00703C] border-b-2 border-[#00703C]' : 'text-gray-500'}`}>OTP Login</button>
            <button onClick={() => setMode('password')} className={`w-1/2 pb-2 text-sm font-medium ${mode === 'password' ? 'text-[#00703C] border-b-2 border-[#00703C]' : 'text-gray-500'}`}>Password Login</button>
          </div>

          {mode === 'otp' ? (
            step === 'phone' ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2547..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00703C] focus:ring-[#00703C] sm:text-sm p-2 border text-gray-900" />
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00703C] hover:bg-[#00582f] disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Access Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Code</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00703C] focus:ring-[#00703C] sm:text-sm p-2 border text-gray-900 font-mono text-center text-xl tracking-widest" />
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00703C] hover:bg-[#00582f] disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </button>
                <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-gray-500 hover:text-gray-700">← Use a different number</button>
              </form>
            )
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2547..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00703C] focus:ring-[#00703C] sm:text-sm p-2 border text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00703C] focus:ring-[#00703C] sm:text-sm p-2 pr-10 border text-gray-900" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">If you don't have a password, use OTP login to set one in your profile.</p>
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00703C] hover:bg-[#00582f] disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransportLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
