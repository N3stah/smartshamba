'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, Database, Brain, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface V3Metrics {
  outbox: {
    pending: number;
    processing: number;
    failed: number;
  };
  blockchain: {
    confirmedAnchors: number;
  };
  marketData: {
    totalObservations: number;
    lastImportedAt: string | null;
    lastObservedAt: string | null;
  };
  model: {
    version: string;
    isFallback: string;
    trainingDataCutoff: string;
  };
  evidence: {
    evidenceCaptured: number;
    evidencePendingAnchoring: number;
  };
}

export default function V3OpsDashboard() {
  const [data, setData] = useState<V3Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/mavuno-metrics')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-admin-primary" /></div>;
  if (error || !data) return <Card className="p-8 text-center text-red-600">Failed to load V3 metrics.</Card>;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">V3 Operations Dashboard</h1>
        <p className="text-sm text-gray-500">MavunoWise Intelligence & Provenance Health</p>
      </div>

      {/* Provenance Pipeline */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3">Provenance Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Outbox Pending</h3>
              <Database className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-text">{data.outbox.pending}</p>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Outbox Processing</h3>
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
            <p className="text-2xl font-bold text-text">{data.outbox.processing}</p>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Outbox Failed</h3>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{data.outbox.failed}</p>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Confirmed Anchors</h3>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{data.blockchain.confirmedAnchors}</p>
          </Card>
        </div>
      </div>

      {/* Intelligence Pipeline */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3">Intelligence Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Model Version</h3>
              <Brain className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-bold text-text">{data.model.version}</p>
            <p className="text-xs text-gray-400 mt-1">Dataset: {data.model.trainingDataCutoff}</p>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Fallback Status</h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-amber-600">{data.model.isFallback}</p>
            <p className="text-xs text-gray-400 mt-1">Cannot confirm fallback status remotely</p>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Market Observations</h3>
              <Database className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-text">{data.marketData.totalObservations}</p>
            <p className="text-xs text-gray-400 mt-1">Last Imported: {formatDate(data.marketData.lastImportedAt)}</p>
            <p className="text-xs text-gray-400">Last Observed: {formatDate(data.marketData.lastObservedAt)}</p>
          </Card>
        </div>
      </div>

      {/* Deal Assurance */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3">Deal Assurance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Evidence Captured</h3>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-text">{data.evidence.evidenceCaptured}</p>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Evidence Pending Anchoring</h3>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{data.evidence.evidencePendingAnchoring}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
