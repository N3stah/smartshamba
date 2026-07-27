'use client';
import { useState, useEffect } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';

export default function NotificationPermission() {
  const [status, setStatus] = useState<'unsupported' | 'default' | 'granted' | 'denied' | 'loading'>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    setStatus(Notification.permission);
  }, []);

  const requestPermissionAndSubscribe = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission);
      
      if (permission === 'granted') {
        // Register service worker
        await navigator.serviceWorker.register('/sw.js');
        const reg = await navigator.serviceWorker.ready;
        
        // Subscribe to push
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        // Send to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
      }
    } catch (err) {
      console.error('[PUSH] Subscription failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'unsupported') return null;
  if (status === 'granted') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 px-3 py-1">
        <BellRing className="w-4 h-4 text-[#00703C]" /> Notifications On
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 px-3 py-1">
        <Bell className="w-4 h-4" /> Blocked
      </div>
    );
  }

  return (
    <button 
      onClick={requestPermissionAndSubscribe}
      disabled={loading}
      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 px-3 py-1 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
      Enable Notifications
    </button>
  );
}
