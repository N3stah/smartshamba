'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ShieldCheck, AlertTriangle, Link as LinkIcon } from 'lucide-react';

interface VerificationData {
  status: 'VERIFIED' | 'NOT_ANCHORED' | 'INTEGRITY_MISMATCH' | 'UNAVAILABLE' | 'UNKNOWN_BATCH';
  batchReference?: string;
  chain?: string;
  evidenceHash?: string;
  anchoredHash?: string;
  transactionHash?: string | null;
  blockNumber?: number | null;
  anchoredAt?: string | null;
}

export default function BatchVerificationPage({ params }: { params: { batchRef: string } }) {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blockchain/verify/${params.batchRef}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.batchRef]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-public-primary" />
      </div>
    );
  }

  if (!data || data.status === 'UNKNOWN_BATCH') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-text">Batch Not Found</h1>
        <p className="text-gray-500 mt-1">This batch reference does not exist in our records.</p>
      </div>
    );
  }

  if (data.status === 'UNAVAILABLE') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-bold text-text">Service Unavailable</h1>
        <p className="text-gray-500 mt-1">The blockchain verification service is temporarily unavailable. Please try again later.</p>
      </div>
    );
  }

  if (data.status === 'NOT_ANCHORED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-bold text-text">Not Yet Anchored</h1>
        <p className="text-gray-500 mt-1">This batch has not yet been anchored on the blockchain.</p>
      </div>
    );
  }

  if (data.status === 'INTEGRITY_MISMATCH') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-text">Integrity Mismatch</h1>
        <p className="text-gray-500 mt-1">The on-chain hash does not match the local evidence record.</p>
      </div>
    );
  }

  // VERIFIED
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-public-primary to-public-primary/80 p-6 text-white text-center">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">MavunoWise Provenance</h1>
          <p className="text-sm text-green-100">Authenticity Verified</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Batch Ref:</span> <span className="font-mono text-xs text-text">{data.batchReference}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Chain:</span> <span className="font-bold text-text">{data.chain}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Evidence Hash:</span> <span className="font-mono text-xs text-text truncate w-32 text-right">{data.evidenceHash?.substring(0, 10)}...{data.evidenceHash?.substring(58)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Anchored Hash:</span> <span className="font-mono text-xs text-text truncate w-32 text-right">{data.anchoredHash?.substring(0, 10)}...{data.anchoredHash?.substring(58)}</span></div>
            {data.transactionHash && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Transaction:</span> 
                <a href={`https://amoy.polygonscan.com/tx/${data.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-public-primary hover:underline flex items-center gap-1 text-xs">
                  <LinkIcon className="w-3 h-3" /> View on Explorer
                </a>
              </div>
            )}
            {data.blockNumber && (
              <div className="flex justify-between"><span className="text-gray-500">Block Number:</span> <span className="font-bold text-text">{data.blockNumber}</span></div>
            )}
            {data.anchoredAt && (
              <div className="flex justify-between"><span className="text-gray-500">Anchored At:</span> <span className="font-bold text-text">{new Date(data.anchoredAt).toLocaleString()}</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
