'use client';
import SmartShambaLogo from '@/components/SmartShambaLogo';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [mode, setMode] = useState<'otp' | 'password' | 'forgot'>('otp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/buyer/dashboard';

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role: 'BUYER' }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to send OTP'); setLoading(false); return; }
    setMessage('OTP sent to your phone. Enter the 6-digit code below.');
    setStep('code');
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, role: 'BUYER' }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Invalid code'); setLoading(false); return; }
    router.push(from); router.refresh();
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, role: 'BUYER' }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Invalid credentials'); setLoading(false); return; }
    router.push(from); router.refresh();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp: code, password: newPassword, role: 'BUYER' }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to reset password'); setLoading(false); return; }
    setMessage('Password reset successfully! You can now login with your new password.');
    setMode('password'); setStep('phone'); setCode(''); setNewPassword('');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <SmartShambaLogo variant="full" size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-white">SmartShamba</h1>
          <p className="text-green-200 mt-1 text-sm">Buyer Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button onClick={() => { setMode('otp'); setStep('phone'); setError(''); setMessage(''); }} className={`w-1/2 pb-2 text-sm font-medium ${mode === 'otp' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}>OTP Login</button>
            <button onClick={() => { setMode('password'); setError(''); setMessage(''); }} className={`w-1/2 pb-2 text-sm font-medium ${mode === 'password' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}>Password Login</button>
          </div>

          {message && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm mb-4">{message}</div>}

          {mode === 'otp' && (
            step === 'phone' ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in via OTP</h2>
                <p className="text-gray-500 text-sm mb-6">Enter the phone number you used to register via USSD.</p>
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254700000000" required autoFocus className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900" />
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}
                  <button type="submit" disabled={loading || !phone} className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-lg transition-colors text-sm">{loading ? 'Sending OTP...' : 'Send OTP →'}</button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Enter OTP</h2>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">6-digit code</label>
                    <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required autoFocus maxLength={6} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono text-center text-xl tracking-widest text-gray-900" />
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}
                  <button type="submit" disabled={loading || code.length !== 6} className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-lg transition-colors text-sm">{loading ? 'Verifying...' : 'Sign in →'}</button>
                  <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(''); }} className="w-full text-gray-500 hover:text-gray-700 text-sm py-2">← Use a different number</button>
                </form>
              </>
            )
          )}

          {mode === 'password' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in with Password</h2>
              <p className="text-gray-500 text-sm mb-6">If you have set a password in your settings, login here.</p>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254700000000" required autoFocus className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}
                <button type="submit" disabled={loading || !phone || !password} className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-lg transition-colors text-sm">{loading ? 'Signing in...' : 'Sign in →'}</button>
                <button type="button" onClick={() => { setMode('forgot'); setStep('phone'); setError(''); setMessage(''); }} className="w-full text-green-700 hover:text-green-800 text-sm py-2 font-medium">Forgot Password?</button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            step === 'phone' ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Forgot Password</h2>
                <p className="text-gray-500 text-sm mb-6">Enter your phone number to receive a reset OTP.</p>
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254700000000" required autoFocus className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900" />
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}
                  <button type="submit" disabled={loading || !phone} className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-lg transition-colors text-sm">{loading ? 'Sending OTP...' : 'Send Reset OTP →'}</button>
                  <button type="button" onClick={() => { setMode('password'); setError(''); }} className="w-full text-gray-500 hover:text-gray-700 text-sm py-2">← Back to Password Login</button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h2>
                <p className="text-gray-500 text-sm mb-6">Enter the OTP sent to your phone and your new password.</p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">6-digit OTP</label>
                    <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required maxLength={6} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono text-center text-xl tracking-widest text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="********" required minLength={6} className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}
                  <button type="submit" disabled={loading || code.length !== 6 || !newPassword} className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-lg transition-colors text-sm">{loading ? 'Resetting...' : 'Reset Password →'}</button>
                </form>
              </>
            )
          )}
        </div>
        <p className="text-center text-xs text-green-300 mt-6">Not registered? Dial <span className="font-mono font-bold">*384*53374#</span> to register via USSD.</p>
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
