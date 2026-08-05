'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  county: string;
}

export default function WeatherAlertBanner({ county }: { county: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`/api/weather/alerts?county=${encodeURIComponent(county)}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch (e) { console.error(e); }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [county]);

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'HEAVY_RAIN': return 'bg-red-50 border-red-300 text-red-800';
      case 'STRONG_WIND': return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'COLD_FROST': return 'bg-blue-50 border-blue-300 text-blue-800';
      case 'HEATWAVE': return 'bg-orange-50 border-orange-300 text-orange-800';
      default: return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
  };

  return (
    <div className="space-y-2 mb-6">
      {visibleAlerts.map(alert => (
        <div key={alert.id} className={`border rounded-xl p-4 flex items-start gap-3 ${getAlertStyle(alert.type)}`}>
          {getAlertIcon(alert.type)}
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-wider">{alert.type.replace(/_/g, ' ')} Alert</p>
            <p className="text-sm mt-1">{alert.message}</p>
          </div>
          <button 
            onClick={() => setDismissed(prev => [...prev, alert.id])}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
