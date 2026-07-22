'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function SyncPoller() {
  const router = useRouter();
  const lastState = useRef<string | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/farmers/sync', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const latestTx = data.transactions?.[0];
          const currentState = latestTx ? `${latestTx.id}-${latestTx.status}` : null;
          
          if (currentState) {
            if (lastState.current && currentState !== lastState.current) {
              console.log('[SYNC] New data detected, refreshing dashboard...');
              router.refresh();
            }
            lastState.current = currentState;
          }
        }
      } catch (error) {
        console.error('[SYNC] Polling error:', error);
      }
    };

    const interval = setInterval(poll, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
