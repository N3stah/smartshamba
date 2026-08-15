'use client';
import { useEffect, useState } from 'react';
import { Activity, UserPlus, ArrowLeftRight, AlertTriangle } from 'lucide-react';

export default function LiveActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/admin/live-stream');

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);

    eventSource.onmessage = (e) => {
      try {
        const newEvents = JSON.parse(e.data);
        setEvents(prev => [...newEvents, ...prev].slice(0, 20)); // Keep last 20 events
      } catch {}
    };

    return () => eventSource.close();
  }, []);

  const getIcon = (type: string) => {
    if (type === 'FARMER_JOINED') return <UserPlus className="w-4 h-4 text-blue-500" />;
    if (type === 'TRANSACTION') return <ArrowLeftRight className="w-4 h-4 text-green-500" />;
    if (type === 'DISPUTE') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity className="w-4 h-4 text-[#00703C]" /> Live Platform Activity</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {connected ? 'Live' : 'Connecting...'}
        </span>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Waiting for live events...</p>
        ) : (
          events.map((event, i) => (
            <div key={i} className="flex items-start gap-3 text-sm border-b pb-2">
              <div className="mt-1">{getIcon(event.type)}</div>
              <p className="text-gray-700">{event.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
