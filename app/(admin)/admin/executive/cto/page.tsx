'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck, Database, Clock, Activity, Server, ChevronRight, FileText, Truck, ShieldAlert, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CTOMetrics {
  system: { nodeVersion: string; platform: string; uptime: number; env: string; };
  database: { status: 'CONNECTED' | 'DISCONNECTED'; latency: number; counts: Record<string, number>; };
  ai: { gemini: string; nvidia: string; openweather: string; predictions: number; };
  integrations: { mapTiler: string; africaTalking: string; mpesaDaraja: string; sentry: string; };
  cron: Array<{ path: string; schedule: string }>;
  security: { rbac: boolean; rateLimiting: boolean; };
  deployment: { vercelEnv: string | undefined; nextVersion: string; };
}

const opsLinks = [
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText, desc: 'Review system actions' },
  { href: '/admin/transport-providers', label: 'Transport Ops', icon: Truck, desc: 'Manage providers' },
  { href: '/admin/reputation', label: 'Trust Engine', icon: ShieldAlert, desc: 'Monitor risk' },
  { href: '/admin/disputes', label: 'Disputes', icon: Users, desc: 'Resolve conflicts' },
];

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

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-admin-primary" /></div>;
  if (error || !data) return <Card className="p-8 text-center text-red-600">Failed to load CTO metrics. {error}</Card>;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days}d ${hours}h`;
  };

  const isHealthy = (status: string) => status === 'CONFIGURED' || status === 'CONNECTED' || status === 'HEALTHY' || status === 'ACTIVE';

  return (
    <div className="space-y-6">
      
      {/* CTO Profile Header */}
      <Card className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-16 h-16 bg-admin-primary rounded-lg flex items-center justify-center text-2xl font-bold text-white">M</div>
        <div>
          <h1 className="text-2xl font-bold text-text font-serif">Mark Manoti Ndege</h1>
          <p className="text-sm text-gray-500">Co-Founder & Chief Technology Officer</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Server className="w-3 h-3" /> Node {data.system.nodeVersion}</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Uptime {formatUptime(data.system.uptime)}</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {data.deployment.vercelEnv || 'Development'}</span>
          </div>
        </div>
      </Card>

      {/* System Health Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Database</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${isHealthy(data.database.status) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {data.database.status}
            </span>
          </div>
          <p className="text-2xl font-bold text-text">{data.database.latency}ms</p>
          <p className="text-xs text-gray-400 mt-1">Latency</p>
        </Card>
        
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">AI Providers</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${isHealthy(data.ai.gemini) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isHealthy(data.ai.gemini) ? 'HEALTHY' : 'DEGRADED'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <p className="text-gray-600">Gemini: <span className={`font-medium ${isHealthy(data.ai.gemini) ? 'text-green-600' : 'text-red-600'}`}>{data.ai.gemini}</span></p>
            <p className="text-gray-600">NVIDIA: <span className={`font-medium ${isHealthy(data.ai.nvidia) ? 'text-green-600' : 'text-red-600'}`}>{data.ai.nvidia}</span></p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Integrations</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${isHealthy(data.integrations.sentry) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {data.integrations.sentry}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <p className="text-gray-600">MapTiler: <span className={`font-medium ${isHealthy(data.integrations.mapTiler) ? 'text-green-600' : 'text-red-600'}`}>{data.integrations.mapTiler}</span></p>
            <p className="text-gray-600">M-Pesa: <span className={`font-medium ${isHealthy(data.integrations.mpesaDaraja) ? 'text-green-600' : 'text-red-600'}`}>{data.integrations.mpesaDaraja}</span></p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Security</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${data.security.rbac ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {data.security.rbac ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <p className="text-gray-600">RBAC: <span className="font-medium text-green-600">Enabled</span></p>
            <p className="text-gray-600">Rate Limit: <span className="font-medium text-green-600">Active</span></p>
          </div>
        </Card>
      </div>

      {/* Database Census & Cron Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2 font-serif"><Database className="w-4 h-4 text-admin-primary" /> Database census</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.database.counts).map(([key, value]) => (
              <div key={key} className="border border-border rounded-md p-3">
                <p className="text-xs text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-xl font-bold text-text mt-1">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2 font-serif"><Clock className="w-4 h-4 text-admin-primary" /> Scheduled jobs</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {data.cron.map((job, i) => (
              <div key={i} className="flex justify-between items-center border border-border rounded-md p-2 text-xs">
                <span className="font-mono text-gray-600">{job.path}</span>
                <span className="font-mono text-admin-primary">{job.schedule}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Operations Launchpad */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-4 font-serif">Operations launchpad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {opsLinks.map(link => (
            <Card key={link.href} className="p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-admin-secondary rounded-md flex items-center justify-center text-admin-primary mb-3">
                  <link.icon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-text text-sm">{link.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
              </div>
              <Link href={link.href} className="mt-4 inline-block">
                <Button variant="outline" size="sm" className="w-full">
                  Manage <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
