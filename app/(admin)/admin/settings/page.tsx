'use client';
import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, Lock, Key, Cpu, CheckCircle, XCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  // MFA Setup State
  const [qrCode, setQrCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  // Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState('');

  useEffect(() => {
    // In a real app, we'd fetch the user's mfaEnabled status here from /api/admin/me
    // For now, we assume false until they verify it.
    setLoading(false);
  }, []);

  const handleSetupMFA = async () => {
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await fetch('/api/admin/auth/mfa/setup');
      const data = await res.json();
      if (res.ok) setQrCode(data.qrCode);
      else setMfaError(data.error || 'Failed to generate QR code');
    } catch (e) {
      setMfaError('Network error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await fetch('/api/admin/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: mfaToken })
      });
      const data = await res.json();
      if (res.ok) {
        setMfaEnabled(true);
        setQrCode('');
        setMfaToken('');
      } else {
        setMfaError(data.error || 'Invalid code');
      }
    } catch (e) {
      setMfaError('Network error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMessage('');
    try {
      const res = await fetch('/api/admin/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok) {
        setPassMessage('Password updated successfully.');
        setCurrentPass('');
        setNewPass('');
      } else {
        setPassMessage(data.error || 'Failed to update password');
      }
    } catch (e) {
      setPassMessage('Network error');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-admin-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500">Manage your security credentials and platform configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security & MFA Section */}
        <div className="bg-surface rounded-lg border border-border shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-admin-primary" /> Security & MFA</h2>
          
          {mfaEnabled ? (
            <div className="bg-green-50 border border-admin-primary/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Multi-Factor Authentication is Enabled</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Secure your account by enabling TOTP-based MFA. Scan the QR code with Google Authenticator or Authy.</p>
              
              {!qrCode ? (
                <button 
                  onClick={handleSetupMFA} 
                  disabled={mfaLoading}
                  className="w-full bg-admin-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-admin-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Generate QR Code
                </button>
              ) : (
                <form onSubmit={handleVerifyMFA} className="space-y-3">
                  <div className="flex justify-center bg-gray-50 p-2 rounded-lg border">
                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Enter 6-digit code from app</label>
                    <input 
                      type="text" 
                      value={mfaToken} 
                      onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                      required 
                      maxLength={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center"
                    />
                  </div>
                  {mfaError && <p className="text-red-500 text-xs">{mfaError}</p>}
                  <button type="submit" disabled={mfaLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {mfaLoading ? 'Verifying...' : 'Verify & Enable MFA'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="bg-surface rounded-lg border border-border shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-admin-primary" /> Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
              <input 
                type="password" 
                value={currentPass} 
                onChange={(e) => setCurrentPass(e.target.value)} 
                required 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
              <input 
                type="password" 
                value={newPass} 
                onChange={(e) => setNewPass(e.target.value)} 
                required 
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters.</p>
            </div>
            {passMessage && <p className={`text-xs ${passMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{passMessage}</p>}
            <button type="submit" disabled={passLoading} className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2">
              {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Platform Configurations (Read-Only) */}
      <div className="bg-surface rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-admin-primary" /> Platform Configurations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 uppercase">Transaction Fee</p>
            <p className="text-lg font-bold text-gray-900">2.0%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 uppercase">Bag Limit</p>
            <p className="text-lg font-bold text-gray-900">500 Bags</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 uppercase">USSD Code</p>
            <p className="text-lg font-bold text-gray-900">*384*53374#</p>
          </div>
        </div>
      </div>
    </div>
  );
}
