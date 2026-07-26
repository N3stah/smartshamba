'use client';
import { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function PasswordSetter({ role, hasPassword }: { role: 'FARMER' | 'BUYER'; hasPassword: boolean }) {
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); setMessage('');
    
    if (password !== confirmPass) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    
    const endpoint = role === 'FARMER' ? '/api/farmers/me/password' : '/api/buyers/me/password';
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    
    if (!res.ok) setError(data.error || 'Failed to set password');
    else { 
      setMessage('Password updated successfully!'); 
      setPassword(''); 
      setConfirmPass('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {hasPassword ? 'New Password (min 6 chars)' : 'Set Password (min 6 chars)'}
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900"
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900"
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}
      
      <button type="submit" disabled={loading || !password || !confirmPass} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {hasPassword ? 'Update Password' : 'Set Password'}
      </button>
    </form>
  );
}
