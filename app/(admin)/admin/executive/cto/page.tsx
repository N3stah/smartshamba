'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck, Database, Clock, Activity, Server, ChevronRight } from 'lucide-react';

interface CTOMetrics {
  system: { nodeVersion: string; platform: string; uptime: number; env: string; };
  database: { status: 'CONNECTED' | 'DISCONNECTED'; latency: number; counts: Record<string, number>; };
  ai: { gemini: string; nvidia: string; openweather: string; predictions: number; };
  integrations: { mapTiler: string; africaTalking: string; mpesaDaraja: string; sentry: string; };
  cron: Array<{ path: string; schedule: string }>;
  security: { rbac: boolean; rateLimiting: boolean; };
  deployment: { vercelEnv: string | undefined; nextVersion: string; };
}

const quickAccessLinks = [
  { href: '/admin/buyers', label: 'Buyers' },
  { href: '/admin/farmers', label: 'Farmers' },
  { href: '/admin/transactions', label: 'Transactions' },
  { href: '/admin/listings', label: 'Listings' },
  { href: '/admin/demands', label: 'Demands' },
  { href: '/admin/groups', label: 'Groups' },
  { href: '/admin/disputes', label: 'Disputes' },
  { href: '/admin/logistics', label: 'Logistics' },
  { href: '/admin/ai-dashboard', label: 'AI Dashboard' },
  { href: '/admin/weather-dashboard', label: 'Weather' },
  { href: '/admin/map', label: 'GIS Map' },
  { href: '/admin/finance', label: 'Finance' },
  { href: '/admin/reputation', label: 'Reputation' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
  { href: '/admin/analytics', label: 'Analytics' },
];

function StatusCard({ title, status, children }: { title: string; status: string; children: React.ReactNode }) {
  const isHealthy = status === 'CONNECTED' || status === 'CONFIGURED' || status === 'HEALTHY' || status === 'ACTIVE';
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase">{title}</h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isHealthy ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {status}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function CTODashboard() {
  const [data, setData] = useState<CTOMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/cto-metrics')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch metrics'))
      .then(d => setData(d))
      .catch(e => setError(e.toString()))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>;
  if (error || !data) return <div className="bg-red-900 border border-red-700 text-red-200 p-8 rounded-xl text-center">Failed to load CTO metrics. {error}</div>;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 -m-4 lg:-m-8 p-4 lg:p-8 space-y-6">
      
      {/* CTO Profile Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 flex items-center gap-6">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">M</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mark Manoti Ndege</h1>
          <p className="text-sm text-gray-400">Co-Founder & Chief Technology Officer</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Server className="w-3 h-3" /> Node {data.system.nodeVersion}</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Uptime {formatUptime(data.system.uptime)}</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {data.deployment.vercelEnv || 'Development'}</span>
          </div>
        </div>
      </div>

      {/* System & Security Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard title="Database" status={data.database.status}>
          <p className="text-2xl font-bold text-white">{data.database.latency}ms</p>
          <p className="text-xs text-gray-500 mt-1">Latency</p>
        </StatusCard>
        <StatusCard title="AI Providers" status={data.ai.gemini === 'CONFIGURED' ? 'HEALTHY' : 'DEGRADED'}>
          <div className="text-xs space-y-1">
            <p>Gemini: <span className={data.ai.gemini === 'CONFIGURED' ? 'text-green-400' : 'text-red-400'}>{data.ai.gemini}</span></p>
            <p>NVIDIA: <span className={data.ai.nvidia === 'CONFIGURED' ? 'text-green-400' : 'text-red-400'}>{data.ai.nvidia}</span></p>
          </div>
        </StatusCard>
        <StatusCard title="Integrations" status={data.integrations.sentry}>
          <div className="text-xs space-y-1">
            <p>MapTiler: <span className={data.integrations.mapTiler === 'CONFIGURED' ? 'text-green-400' : 'text-red-400'}>{data.integrations.mapTiler}</span></p>
            <p>M-Pesa: <span className={data.integrations.mpesaDaraja === 'CONFIGURED' ? 'text-green-400' : 'text-red-400'}>{data.integrations.mpesaDaraja}</span></p>
          </div>
        </StatusCard>
        <StatusCard title="Security" status={data.security.rbac ? 'ACTIVE' : 'INACTIVE'}>
          <div className="text-xs space-y-1">
            <p>RBAC: <span className="text-green-400">Enabled</span></p>
            <p>Rate Limit: <span className="text-green-400">Active</span></p>
          </div>
        </StatusCard>
      </div>

      {/* Database Census */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase mb-4 flex items-center gap-2"><Database className="w-4 h-4" /> Database Census</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Object.entries(data.database.counts).map(([key, value]) => (
            <div key={key} className="bg-gray-900 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Jobs & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Scheduled Jobs</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.cron.map((job, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-900 rounded-lg text-xs">
                <span className="font-mono text-gray-400">{job.path}</span>
                <span className="font-mono text-green-400">{job.schedule}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase mb-4 flex items-center gap-2"><ChevronRight className="w-4 h-4" /> Quick Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quickAccessLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-xs bg-gray-900 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors text-center">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
