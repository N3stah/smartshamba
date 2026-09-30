'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function PinSetter({ role, hasPin }: { role: 'FARMER' | 'BUYER' | 'TRANSPORT'; hasPin: boolean }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); setMessage('');
    
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      setLoading(false);
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.');
      setLoading(false);
      return;
    }
    
    const endpoint = role === 'FARMER' ? '/api/farmers/me/pin' : role === 'BUYER' ? '/api/buyers/me/pin' : '/api/transport/me/pin';
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    
    if (!res.ok) setError(data.error || 'Failed to set PIN');
    else { 
      setMessage('PIN updated successfully!'); 
      setPin(''); 
      setConfirmPin('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {hasPin ? 'New 4-digit PIN' : 'Set 4-digit PIN'}
        </label>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900 font-mono tracking-widest"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm PIN
        </label>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600 text-gray-900 font-mono tracking-widest"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}
      
      <button type="submit" disabled={loading || !pin || !confirmPin} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {hasPin ? 'Update PIN' : 'Set PIN'}
      </button>
    </form>
  );
}
